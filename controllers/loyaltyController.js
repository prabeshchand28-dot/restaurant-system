const prisma = require('../config/prisma');

const POINTS_PER_100 = 1; // 1 point per Rs.100 spent
const TIERS = [
  { name: 'Platinum', min: 5000 },
  { name: 'Gold',     min: 2000 },
  { name: 'Silver',   min: 500  },
  { name: 'Bronze',   min: 0    },
];

function getTier(points) {
  return (TIERS.find(t => points >= t.min) || TIERS[3]).name;
}

exports.getAll = async (req, res) => {
  try {
    const accounts = await prisma.loyaltyAccount.findMany({ orderBy: { totalPoints: 'desc' } });
    res.json(accounts);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getByPhone = async (req, res) => {
  try {
    const acc = await prisma.loyaltyAccount.findUnique({
      where: { phone: req.params.phone },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!acc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json(acc);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, email, birthday } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'name and phone required' });
    const acc = await prisma.loyaltyAccount.upsert({
      where: { phone },
      update: { name, email: email || '', updatedAt: new Date() },
      create: { name, phone, email: email || '', birthday: birthday || '' },
    });
    res.json({ success: true, account: acc });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.earnPoints = async (req, res) => {
  try {
    const { phone, orderAmount, orderId, description } = req.body;
    if (!phone || !orderAmount) return res.status(400).json({ success: false, message: 'phone and orderAmount required' });

    const points = Math.floor(orderAmount / 100) * POINTS_PER_100;
    let acc = await prisma.loyaltyAccount.findUnique({ where: { phone } });
    if (!acc) return res.status(404).json({ success: false, message: 'Loyalty account not found' });

    const newTotal = acc.totalPoints + points;
    const newSpent = acc.totalSpent + parseInt(orderAmount);
    const tier = getTier(newTotal);

    acc = await prisma.loyaltyAccount.update({
      where: { phone },
      data: { totalPoints: newTotal, totalSpent: newSpent, tier, updatedAt: new Date() },
    });
    await prisma.loyaltyTx.create({
      data: { accountId: acc.id, type: 'earn', points, description: description || `Order #${orderId}`, orderId: orderId ? parseInt(orderId) : null },
    });
    res.json({ success: true, pointsEarned: points, totalPoints: newTotal, tier });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.redeemPoints = async (req, res) => {
  try {
    const { phone, points, description } = req.body;
    if (!phone || !points) return res.status(400).json({ success: false, message: 'phone and points required' });

    const acc = await prisma.loyaltyAccount.findUnique({ where: { phone } });
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });
    if (acc.totalPoints < points) return res.status(400).json({ success: false, message: 'Insufficient points' });

    const newTotal = acc.totalPoints - parseInt(points);
    const tier = getTier(newTotal);
    const discountAmount = parseInt(points) * 1; // 1 point = Rs. 1

    await prisma.loyaltyAccount.update({
      where: { phone },
      data: { totalPoints: newTotal, tier, updatedAt: new Date() },
    });
    await prisma.loyaltyTx.create({
      data: { accountId: acc.id, type: 'redeem', points: -parseInt(points), description: description || 'Points redeemed' },
    });
    res.json({ success: true, pointsRedeemed: points, discountAmount, remainingPoints: newTotal });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.adjust = async (req, res) => {
  try {
    const { phone, points, description } = req.body;
    const acc = await prisma.loyaltyAccount.findUnique({ where: { phone } });
    if (!acc) return res.status(404).json({ success: false, message: 'Account not found' });
    const newTotal = Math.max(0, acc.totalPoints + parseInt(points));
    const tier = getTier(newTotal);
    await prisma.loyaltyAccount.update({ where: { phone }, data: { totalPoints: newTotal, tier, updatedAt: new Date() } });
    await prisma.loyaltyTx.create({
      data: { accountId: acc.id, type: 'adjust', points: parseInt(points), description: description || 'Manual adjustment' },
    });
    res.json({ success: true, totalPoints: newTotal });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
