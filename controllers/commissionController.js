const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const currentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

exports.getCommissions = async (req, res) => {
  try {
    const { period, status, staffId } = req.query;
    const where = {};
    if (period) where.period = period;
    if (status) where.status = status;
    if (staffId) where.staffId = Number(staffId);
    const commissions = await prisma.staffCommission.findMany({ where, orderBy: [{ period: 'desc' }, { staffName: 'asc' }] });
    res.json(commissions);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.upsertCommission = async (req, res) => {
  try {
    const { staffId, staffName, period, salesAmount, commissionRate, notes } = req.body;
    if (!staffId || salesAmount === undefined || commissionRate === undefined)
      return res.status(400).json({ message: 'staffId, salesAmount, commissionRate required' });
    const p = period || currentPeriod();
    const sa = parseFloat(salesAmount);
    const cr = parseFloat(commissionRate);
    const commissionAmount = Math.round(sa * cr / 100 * 100) / 100;
    const record = await prisma.staffCommission.upsert({
      where: { staffId_period: { staffId: Number(staffId), period: p } },
      update: { salesAmount: sa, commissionRate: cr, commissionAmount, notes: notes || '', updatedAt: new Date() },
      create: { staffId: Number(staffId), staffName: staffName || '', period: p, salesAmount: sa, commissionRate: cr, commissionAmount, notes: notes || '' },
    });
    res.status(201).json(record);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.approve = async (req, res) => {
  try {
    const rec = await prisma.staffCommission.update({
      where: { id: Number(req.params.id) },
      data: { status: 'APPROVED', updatedAt: new Date() },
    });
    res.json(rec);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.markPaid = async (req, res) => {
  try {
    const { paidBy } = req.body;
    const rec = await prisma.staffCommission.update({
      where: { id: Number(req.params.id) },
      data: { status: 'PAID', paidAt: new Date(), paidBy: paidBy || '', updatedAt: new Date() },
    });
    res.json(rec);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteCommission = async (req, res) => {
  try {
    await prisma.staffCommission.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const period = req.query.period || currentPeriod();
    const [pending, approved, paid, agg] = await Promise.all([
      prisma.staffCommission.count({ where: { period, status: 'PENDING' } }),
      prisma.staffCommission.count({ where: { period, status: 'APPROVED' } }),
      prisma.staffCommission.count({ where: { period, status: 'PAID' } }),
      prisma.staffCommission.aggregate({ _sum: { commissionAmount: true, salesAmount: true }, where: { period } }),
    ]);
    res.json({ period, pending, approved, paid, totalCommission: agg._sum.commissionAmount || 0, totalSales: agg._sum.salesAmount || 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getPeriods = async (req, res) => {
  try {
    const rows = await prisma.staffCommission.findMany({ select: { period: true }, distinct: ['period'], orderBy: { period: 'desc' } });
    res.json(rows.map(r => r.period));
  } catch (e) { res.status(500).json({ message: e.message }); }
};
