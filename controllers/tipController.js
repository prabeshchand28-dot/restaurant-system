const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/tips?from=&to=
exports.getAll = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); where.date.lte = d; }
    }
    const tips = await prisma.tipRecord.findMany({ where, include: { distributions: true }, orderBy: { date: 'desc' } });
    res.json(tips);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/tips — create tip record + auto-distribute
exports.create = async (req, res) => {
  try {
    const { date, shiftType, totalTips, method, notes, staffIds } = req.body;
    if (!totalTips || !staffIds || !staffIds.length)
      return res.status(400).json({ message: 'totalTips and staffIds required' });

    const total = parseFloat(totalTips);
    const perPerson = parseFloat((total / staffIds.length).toFixed(2));
    const pct = parseFloat((100 / staffIds.length).toFixed(2));

    // Fetch staff names
    const staffList = await prisma.user.findMany({ where: { id: { in: staffIds.map(Number) } } });
    const nameMap = Object.fromEntries(staffList.map(s => [s.id, s.name]));

    const tip = await prisma.tipRecord.create({
      data: {
        date: date ? new Date(date) : new Date(),
        shiftType: shiftType || 'DINNER',
        totalTips: total,
        method: method || 'CASH',
        notes: notes || '',
        distributedAt: new Date(),
        distributions: {
          create: staffIds.map(id => ({
            staffId: parseInt(id),
            staffName: nameMap[parseInt(id)] || 'Unknown',
            amount: perPerson,
            percentage: pct,
          })),
        },
      },
      include: { distributions: true },
    });
    res.json(tip);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/tips/:id/distribute — custom distribution
exports.distribute = async (req, res) => {
  try {
    const { distributions } = req.body; // [{staffId, amount, percentage}]
    const tipId = parseInt(req.params.id);
    await prisma.tipDistribution.deleteMany({ where: { tipRecordId: tipId } });
    const staffList = await prisma.user.findMany({ where: { id: { in: distributions.map(d => parseInt(d.staffId)) } } });
    const nameMap = Object.fromEntries(staffList.map(s => [s.id, s.name]));
    await prisma.tipDistribution.createMany({
      data: distributions.map(d => ({
        tipRecordId: tipId,
        staffId: parseInt(d.staffId),
        staffName: nameMap[parseInt(d.staffId)] || 'Unknown',
        amount: parseFloat(d.amount) || 0,
        percentage: parseFloat(d.percentage) || 0,
      })),
    });
    await prisma.tipRecord.update({ where: { id: tipId }, data: { distributedAt: new Date() } });
    const tip = await prisma.tipRecord.findUnique({ where: { id: tipId }, include: { distributions: true } });
    res.json(tip);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/tips/:id
exports.remove = async (req, res) => {
  try {
    await prisma.tipRecord.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/tips/summary?months=1
exports.summary = async (req, res) => {
  try {
    const months = parseInt(req.query.months || 1);
    const since = new Date(); since.setMonth(since.getMonth() - months);
    const tips = await prisma.tipRecord.findMany({ where: { date: { gte: since } }, include: { distributions: true } });
    const total = tips.reduce((s, t) => s + (t.totalTips || 0), 0);
    // Per-staff totals
    const staffMap = {};
    tips.forEach(t => t.distributions.forEach(d => {
      if (!staffMap[d.staffId]) staffMap[d.staffId] = { staffId: d.staffId, name: d.staffName, total: 0 };
      staffMap[d.staffId].total += d.amount;
    }));
    res.json({ total, count: tips.length, perStaff: Object.values(staffMap).sort((a,b)=>b.total-a.total) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
