const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getVoids = async (req, res) => {
  try {
    const { status, type, from, to } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); where.createdAt.lte = d; }
    }
    const logs = await prisma.voidLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(logs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createVoid = async (req, res) => {
  try {
    const { orderId, orderRef, type, amount, reason, items, requestedBy, notes } = req.body;
    if (!amount || !reason) return res.status(400).json({ message: 'Amount and reason required' });
    const log = await prisma.voidLog.create({
      data: {
        orderId: orderId ? Number(orderId) : null,
        orderRef: orderRef || '',
        type: type || 'VOID',
        amount: Number(amount),
        reason,
        items: items || '',
        requestedBy: requestedBy || '',
        notes: notes || '',
      },
    });
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.approve = async (req, res) => {
  try {
    const { approvedBy } = req.body;
    if (!approvedBy) return res.status(400).json({ message: 'approvedBy required' });
    const log = await prisma.voidLog.update({
      where: { id: Number(req.params.id) },
      data: { status: 'APPROVED', approvedBy },
    });
    res.json(log);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.reject = async (req, res) => {
  try {
    const { approvedBy } = req.body;
    const log = await prisma.voidLog.update({
      where: { id: Number(req.params.id) },
      data: { status: 'REJECTED', approvedBy: approvedBy || '' },
    });
    res.json(log);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteVoid = async (req, res) => {
  try {
    await prisma.voidLog.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const [pending, approvedToday, agg, byType] = await Promise.all([
      prisma.voidLog.count({ where: { status: 'PENDING' } }),
      prisma.voidLog.count({ where: { status: 'APPROVED', createdAt: { gte: today } } }),
      prisma.voidLog.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED' } }),
      prisma.voidLog.groupBy({ by: ['type'], _sum: { amount: true }, where: { status: 'APPROVED' } }),
    ]);
    const typeMap = {};
    byType.forEach(r => { typeMap[r.type] = r._sum.amount || 0; });
    res.json({ pending, approvedToday, totalApproved: agg._sum.amount || 0, byType: typeMap });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
