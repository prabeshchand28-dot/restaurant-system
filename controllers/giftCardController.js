const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// GET all
exports.getAll = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { recipientName: { contains: search, mode: 'insensitive' } },
      { recipientPhone: { contains: search } },
    ];
    const cards = await prisma.giftCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    res.json(cards);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET by code (public balance check)
exports.getByCode = async (req, res) => {
  try {
    const card = await prisma.giftCard.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    res.json(card);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST issue new gift card
exports.issue = async (req, res) => {
  try {
    const { amount, recipientName = '', recipientPhone = '', purchasedBy = '', expiresAt, notes = '' } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount required' });
    const code = genCode();
    const card = await prisma.giftCard.create({
      data: {
        code,
        initialValue: parseFloat(amount),
        balance: parseFloat(amount),
        recipientName, recipientPhone, purchasedBy, notes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        transactions: {
          create: {
            type: 'ISSUE',
            amount: parseFloat(amount),
            balanceAfter: parseFloat(amount),
            processedBy: purchasedBy,
          },
        },
      },
      include: { transactions: true },
    });
    res.json(card);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST redeem
exports.redeem = async (req, res) => {
  try {
    const { code, amount, reference = '', processedBy = '' } = req.body;
    if (!code || !amount) return res.status(400).json({ message: 'Code and amount required' });
    const card = await prisma.giftCard.findUnique({ where: { code: code.toUpperCase() } });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    if (card.status !== 'ACTIVE') return res.status(400).json({ message: `Card is ${card.status}` });
    if (card.expiresAt && new Date() > card.expiresAt) {
      await prisma.giftCard.update({ where: { id: card.id }, data: { status: 'EXPIRED' } });
      return res.status(400).json({ message: 'Card has expired' });
    }
    const amt = parseFloat(amount);
    if (amt > card.balance) return res.status(400).json({ message: `Insufficient balance. Available: ${card.balance}` });
    const newBalance = card.balance - amt;
    const updated = await prisma.giftCard.update({
      where: { id: card.id },
      data: {
        balance: newBalance,
        status: newBalance === 0 ? 'REDEEMED' : 'ACTIVE',
        transactions: { create: { type: 'REDEEM', amount: amt, balanceAfter: newBalance, reference, processedBy } },
      },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST reload (add balance)
exports.reload = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, processedBy = '' } = req.body;
    const card = await prisma.giftCard.findUnique({ where: { id: parseInt(id) } });
    if (!card) return res.status(404).json({ message: 'Card not found' });
    const newBalance = card.balance + parseFloat(amount);
    const updated = await prisma.giftCard.update({
      where: { id: parseInt(id) },
      data: {
        balance: newBalance,
        status: 'ACTIVE',
        transactions: { create: { type: 'RELOAD', amount: parseFloat(amount), balanceAfter: newBalance, processedBy } },
      },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH void
exports.voidCard = async (req, res) => {
  try {
    const card = await prisma.giftCard.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'VOID' },
    });
    res.json(card);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET stats
exports.stats = async (req, res) => {
  try {
    const [total, active, totalIssued, totalRedeemed] = await Promise.all([
      prisma.giftCard.count(),
      prisma.giftCard.count({ where: { status: 'ACTIVE' } }),
      prisma.giftCard.aggregate({ _sum: { initialValue: true } }),
      prisma.giftCardTransaction.aggregate({ where: { type: 'REDEEM' }, _sum: { amount: true } }),
    ]);
    const outstanding = await prisma.giftCard.aggregate({ where: { status: 'ACTIVE' }, _sum: { balance: true } });
    res.json({
      total, active,
      totalIssued: totalIssued._sum.initialValue || 0,
      totalRedeemed: totalRedeemed._sum.amount || 0,
      outstanding: outstanding._sum.balance || 0,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
