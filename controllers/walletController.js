const prisma = require('../config/prisma');

// ── Wallet ─────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const wallets = await prisma.customerWallet.findMany({ orderBy: { balance: 'desc' } });
    res.json(wallets);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getByPhone = async (req, res) => {
  try {
    const w = await prisma.customerWallet.findUnique({
      where: { phone: req.params.phone },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!w) return res.status(404).json({ success: false, message: 'Wallet not found' });
    res.json(w);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone || !name) return res.status(400).json({ success: false, message: 'phone and name required' });
    const wallet = await prisma.customerWallet.upsert({
      where: { phone },
      update: { name },
      create: { phone, name },
    });
    res.json({ success: true, wallet });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.topUp = async (req, res) => {
  try {
    const { phone, amount, description } = req.body;
    if (!phone || !amount) return res.status(400).json({ success: false, message: 'phone and amount required' });
    const wallet = await prisma.customerWallet.findUnique({ where: { phone } });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });
    const newBalance = wallet.balance + parseInt(amount);
    const updated = await prisma.customerWallet.update({
      where: { phone },
      data: { balance: newBalance, totalTopUp: wallet.totalTopUp + parseInt(amount), updatedAt: new Date() },
    });
    await prisma.walletTx.create({
      data: { walletId: wallet.id, type: 'topup', amount: parseInt(amount), description: description || 'Top-up' },
    });
    res.json({ success: true, balance: newBalance, wallet: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.spend = async (req, res) => {
  try {
    const { phone, amount, description, orderId } = req.body;
    if (!phone || !amount) return res.status(400).json({ success: false, message: 'phone and amount required' });
    const wallet = await prisma.customerWallet.findUnique({ where: { phone } });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });
    if (wallet.balance < parseInt(amount)) return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    const newBalance = wallet.balance - parseInt(amount);
    await prisma.customerWallet.update({
      where: { phone },
      data: { balance: newBalance, totalSpent: wallet.totalSpent + parseInt(amount), updatedAt: new Date() },
    });
    await prisma.walletTx.create({
      data: { walletId: wallet.id, type: 'spend', amount: -parseInt(amount), description: description || 'Order payment', orderId: orderId ? parseInt(orderId) : null },
    });
    res.json({ success: true, balance: newBalance });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Membership ──────────────────────────────────────────────
const MEMBERSHIP_PERKS = {
  Basic:    { discount: 5,  perks: 'Priority seating, Birthday discount 10%' },
  Silver:   { discount: 10, perks: 'Priority seating, Birthday discount 15%, Free dessert monthly' },
  Gold:     { discount: 15, perks: 'VIP seating, Birthday discount 20%, Free dessert weekly, Complimentary drinks' },
  Platinum: { discount: 20, perks: 'Dedicated server, Birthday dinner free, Daily complimentary drinks, Private event access' },
};

exports.getAllMemberships = async (req, res) => {
  try {
    const mems = await prisma.membership.findMany({ orderBy: { tier: 'asc' } });
    res.json(mems);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createMembership = async (req, res) => {
  try {
    const { phone, name, email, tier, months } = req.body;
    if (!phone || !name) return res.status(400).json({ success: false, message: 'phone and name required' });
    const t = tier || 'Basic';
    const perks = MEMBERSHIP_PERKS[t] || MEMBERSHIP_PERKS.Basic;
    const start = new Date();
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + (parseInt(months) || 12));
    const mem = await prisma.membership.upsert({
      where: { phone },
      update: { name, email: email||'', tier: t, startDate: start.toISOString().slice(0,10), expiryDate: expiry.toISOString().slice(0,10), autoDiscount: perks.discount, perks: perks.perks, active: true },
      create: { phone, name, email: email||'', tier: t, startDate: start.toISOString().slice(0,10), expiryDate: expiry.toISOString().slice(0,10), autoDiscount: perks.discount, perks: perks.perks },
    });
    res.json({ success: true, membership: mem });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getMembershipByPhone = async (req, res) => {
  try {
    const mem = await prisma.membership.findUnique({ where: { phone: req.params.phone } });
    if (!mem) return res.status(404).json({ success: false, message: 'No membership found' });
    const expired = new Date() > new Date(mem.expiryDate);
    res.json({ ...mem, expired });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getMembershipTiers = async (req, res) => {
  res.json(Object.entries(MEMBERSHIP_PERKS).map(([tier, info]) => ({ tier, ...info })));
};
