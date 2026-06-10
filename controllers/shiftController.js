const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const { week, userId } = req.query;
    const where = {};
    if (week) {
      // week = YYYY-Www or just pass start date YYYY-MM-DD
      const start = new Date(week);
      const end   = new Date(start); end.setDate(end.getDate() + 6);
      const fmt   = d => d.toISOString().slice(0, 10);
      // get all shifts where date between start and end
      const shifts = await prisma.shift.findMany({
        where: { date: { gte: fmt(start), lte: fmt(end) }, ...(userId && { userId: parseInt(userId) }) },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });
      return res.json(shifts);
    }
    if (userId) where.userId = parseInt(userId);
    const shifts = await prisma.shift.findMany({ where, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] });
    res.json(shifts);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { userId, userName, userRole, date, startTime, endTime, position, notes } = req.body;
    if (!userId || !date || !startTime || !endTime)
      return res.status(400).json({ success: false, message: 'userId, date, startTime, endTime required' });
    const shift = await prisma.shift.create({
      data: { userId: parseInt(userId), userName: userName||'', userRole: userRole||'', date, startTime, endTime, position: position||'', notes: notes||'' },
    });
    res.json({ success: true, shift });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { startTime, endTime, position, notes, status } = req.body;
    const shift = await prisma.shift.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(startTime && { startTime }),
        ...(endTime   && { endTime }),
        ...(position  !== undefined && { position }),
        ...(notes     !== undefined && { notes }),
        ...(status    && { status }),
      },
    });
    res.json({ success: true, shift });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.shift.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getWeeklySummary = async (req, res) => {
  try {
    const { startDate } = req.query;
    const start = startDate ? new Date(startDate) : (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d; })();
    const end   = new Date(start); end.setDate(end.getDate() + 6);
    const fmt   = d => d.toISOString().slice(0, 10);
    const shifts = await prisma.shift.findMany({
      where: { date: { gte: fmt(start), lte: fmt(end) } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    // Group by userId
    const byUser = {};
    shifts.forEach(s => {
      if (!byUser[s.userId]) byUser[s.userId] = { userId: s.userId, userName: s.userName, userRole: s.userRole, shifts: [], totalHours: 0 };
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      byUser[s.userId].shifts.push(s);
      byUser[s.userId].totalHours += Math.max(0, hours);
    });
    res.json({ startDate: fmt(start), endDate: fmt(end), staff: Object.values(byUser) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
