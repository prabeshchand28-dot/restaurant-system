const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { code, type, value, minOrder, maxUses, expiresAt, description } = req.body;
    if (!code || !type || !value) return res.status(400).json({ success: false, message: 'code, type, value required' });
    if (!['percent', 'fixed'].includes(type)) return res.status(400).json({ success: false, message: 'type must be percent or fixed' });

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minOrder: parseInt(minOrder) || 0,
        maxUses: parseInt(maxUses) || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        description: description || '',
      },
    });
    res.json({ success: true, coupon });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.validate = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'code required' });

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (!coupon.active) return res.status(400).json({ success: false, message: 'Coupon is inactive' });
    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    if (orderAmount && parseInt(orderAmount) < coupon.minOrder)
      return res.status(400).json({ success: false, message: `Minimum order रू ${coupon.minOrder} required` });

    const amt = parseInt(orderAmount) || 0;
    const discount = coupon.type === 'percent'
      ? Math.round(amt * coupon.value / 100)
      : Math.min(coupon.value, amt);

    res.json({ success: true, coupon, discount });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.use = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.toggle = async (req, res) => {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!coupon) return res.status(404).json({ success: false, message: 'Not found' });
    const updated = await prisma.coupon.update({ where: { id: coupon.id }, data: { active: !coupon.active } });
    res.json({ success: true, coupon: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Gift Cards
exports.getAllGiftCards = async (req, res) => {
  try {
    const cards = await prisma.giftCard.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(cards);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createGiftCard = async (req, res) => {
  try {
    const { amount, purchasedBy, recipientName, expiresAt } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: 'amount required' });
    const code = 'GC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const card = await prisma.giftCard.create({
      data: {
        code,
        balance: parseInt(amount),
        initialAmt: parseInt(amount),
        purchasedBy: purchasedBy || '',
        recipientName: recipientName || '',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    res.json({ success: true, card });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.validateGiftCard = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const card = await prisma.giftCard.findUnique({ where: { code: code.toUpperCase() } });
    if (!card) return res.status(404).json({ success: false, message: 'Gift card not found' });
    if (!card.active) return res.status(400).json({ success: false, message: 'Gift card is inactive' });
    if (card.expiresAt && new Date() > card.expiresAt)
      return res.status(400).json({ success: false, message: 'Gift card has expired' });
    if (card.balance <= 0) return res.status(400).json({ success: false, message: 'Gift card has no balance' });
    const deduct = Math.min(card.balance, parseInt(amount) || card.balance);
    res.json({ success: true, card, deductable: deduct });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.useGiftCard = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const card = await prisma.giftCard.findUnique({ where: { code: code.toUpperCase() } });
    if (!card) return res.status(404).json({ success: false, message: 'Not found' });
    const deduct = Math.min(card.balance, parseInt(amount));
    const newBalance = card.balance - deduct;
    await prisma.giftCard.update({
      where: { id: card.id },
      data: { balance: newBalance, active: newBalance > 0 },
    });
    res.json({ success: true, deducted: deduct, remainingBalance: newBalance });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
