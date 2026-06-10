const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDeposits = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); where.createdAt.lte = d; }
    }
    const deposits = await prisma.reservationDeposit.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(deposits);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createDeposit = async (req, res) => {
  try {
    const { customerName, phone, reservationDate, partySize, amount, paymentMethod, receivedBy, notes } = req.body;
    if (!customerName || !amount) return res.status(400).json({ message: 'Customer name and amount required' });
    const dep = await prisma.reservationDeposit.create({
      data: {
        customerName,
        phone: phone || '',
        reservationDate: reservationDate ? new Date(reservationDate) : null,
        partySize: partySize ? Number(partySize) : 2,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || 'CASH',
        receivedBy: receivedBy || '',
        notes: notes || '',
      },
    });
    res.status(201).json(dep);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, refundReason } = req.body;
    const valid = ['RECEIVED', 'APPLIED', 'REFUNDED', 'FORFEITED'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const dep = await prisma.reservationDeposit.update({
      where: { id: Number(req.params.id) },
      data: { status, refundReason: refundReason || '', updatedAt: new Date() },
    });
    res.json(dep);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteDeposit = async (req, res) => {
  try {
    await prisma.reservationDeposit.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const [received, applied, refunded, forfeited, agg] = await Promise.all([
      prisma.reservationDeposit.count({ where: { status: 'RECEIVED' } }),
      prisma.reservationDeposit.count({ where: { status: 'APPLIED' } }),
      prisma.reservationDeposit.count({ where: { status: 'REFUNDED' } }),
      prisma.reservationDeposit.count({ where: { status: 'FORFEITED' } }),
      prisma.reservationDeposit.aggregate({ _sum: { amount: true }, where: { status: 'RECEIVED' } }),
    ]);
    res.json({ received, applied, refunded, forfeited, heldAmount: agg._sum.amount || 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
