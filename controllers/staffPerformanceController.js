const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLeaderboard = async (req, res) => {
  try {
    const { month } = req.query;
    let dateFilter = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      dateFilter = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const staff = await prisma.staff.findMany({ where: { active: true } });
    const attendance = await prisma.attendance.findMany({
      where: month ? { date: { gte: new Date(dateFilter.gte), lt: new Date(dateFilter.lt) } } : {},
      select: { staffId: true, status: true, checkIn: true, checkOut: true }
    });
    const ratings = await prisma.rating.findMany({
      where: month ? { createdAt: dateFilter } : {},
      select: { staffId: true, rating: true }
    });
    const logs = await prisma.staffPerformanceLog.findMany({
      where: month ? { createdAt: dateFilter } : {},
    });

    const metrics = staff.map(s => {
      const att = attendance.filter(a => a.staffId === s.id);
      const present = att.filter(a => a.status === 'PRESENT').length;
      const late    = att.filter(a => a.status === 'LATE').length;
      const absent  = att.filter(a => a.status === 'ABSENT').length;
      const total   = att.length;
      const attPct  = total ? Math.round((present + late) / total * 100) : null;

      const staffRatings = ratings.filter(r => r.staffId === s.id);
      const avgRating = staffRatings.length
        ? Math.round(staffRatings.reduce((s, r) => s + r.rating, 0) / staffRatings.length * 10) / 10
        : null;

      const perfLogs = logs.filter(l => l.staffId === s.id);
      const commendations = perfLogs.filter(l => l.metric === 'COMMENDATION').length;
      const complaints    = perfLogs.filter(l => l.metric === 'COMPLAINT').length;
      const ordersServed  = perfLogs.filter(l => l.metric === 'ORDERS_SERVED').reduce((s, l) => s + l.value, 0);

      // Avg hours per shift
      const withHours = att.filter(a => a.checkIn && a.checkOut);
      const avgHours  = withHours.length
        ? withHours.reduce((s, a) => s + (new Date(a.checkOut) - new Date(a.checkIn)) / 3600000, 0) / withHours.length
        : null;

      // Score (0-100)
      const score = Math.round(
        (attPct || 0) * 0.4 +
        ((avgRating || 3) / 5 * 100) * 0.4 +
        (commendations * 5 - complaints * 10) * 0.2
      );

      return { ...s, present, late, absent, total, attPct, avgRating, commendations, complaints, ordersServed, avgHours: avgHours ? Math.round(avgHours * 10) / 10 : null, score: Math.max(0, Math.min(100, score)), ratingCount: staffRatings.length };
    });

    metrics.sort((a, b) => b.score - a.score);
    res.json(metrics);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStaffDetail = async (req, res) => {
  try {
    const id = +req.params.id;
    const [staff, attendance, ratings, logs] = await Promise.all([
      prisma.staff.findUnique({ where: { id } }),
      prisma.attendance.findMany({ where: { staffId: id }, orderBy: { date: 'desc' }, take: 30 }),
      prisma.rating.findMany({ where: { staffId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.staffPerformanceLog.findMany({ where: { staffId: id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ staff, attendance, ratings, logs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.logPerformance = async (req, res) => {
  try {
    const { staffId, metric, value, note, recordedBy } = req.body;
    if (!staffId || !metric) return res.status(400).json({ message: 'staffId and metric required' });
    const log = await prisma.staffPerformanceLog.create({
      data: { staffId: +staffId, metric, value: +value || 1, note: note || '', recordedBy: recordedBy || '' }
    });
    res.json(log);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getLogs = async (req, res) => {
  try {
    const { staffId, metric } = req.query;
    const where = {};
    if (staffId) where.staffId = +staffId;
    if (metric) where.metric = metric;
    const logs = await prisma.staffPerformanceLog.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 100
    });
    res.json(logs);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
