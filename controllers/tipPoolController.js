const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getPools = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const pools = await prisma.tipPool.findMany({
      where,
      include: { entries: true },
      orderBy: { date: 'desc' },
      take: 50,
    });
    res.json(pools);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createPool = async (req, res) => {
  try {
    const { date, shift, totalTips, notes, entries } = req.body;
    if (!totalTips || !entries || !entries.length) return res.status(400).json({ message: 'totalTips and entries required' });
    const totalHours = entries.reduce((s, e) => s + parseFloat(e.hoursWorked || 0), 0);
    if (totalHours <= 0) return res.status(400).json({ message: 'Total hours must be > 0' });
    const total = parseFloat(totalTips);
    const pool = await prisma.tipPool.create({
      data: {
        date: date ? new Date(date) : new Date(),
        shift: shift || 'ALL',
        totalTips: total,
        notes: notes || '',
        entries: {
          create: entries.map(e => ({
            staffId: Number(e.staffId),
            staffName: e.staffName || '',
            hoursWorked: parseFloat(e.hoursWorked || 0),
            tipShare: Math.round((parseFloat(e.hoursWorked || 0) / totalHours) * total * 100) / 100,
          })),
        },
      },
      include: { entries: true },
    });
    res.status(201).json(pool);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.distribute = async (req, res) => {
  try {
    const { closedBy } = req.body;
    const pool = await prisma.tipPool.update({
      where: { id: Number(req.params.id) },
      data: { status: 'DISTRIBUTED', closedBy: closedBy || '', updatedAt: new Date() },
      include: { entries: true },
    });
    res.json(pool);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deletePool = async (req, res) => {
  try {
    await prisma.tipPool.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [open, distributed, todayAgg, monthAgg] = await Promise.all([
      prisma.tipPool.count({ where: { status: 'OPEN' } }),
      prisma.tipPool.count({ where: { status: 'DISTRIBUTED' } }),
      prisma.tipPool.aggregate({ _sum: { totalTips: true }, where: { date: { gte: today } } }),
      prisma.tipPool.aggregate({ _sum: { totalTips: true }, where: { date: { gte: monthStart } } }),
    ]);
    res.json({ open, distributed, todayTips: todayAgg._sum.totalTips || 0, monthTips: monthAgg._sum.totalTips || 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
