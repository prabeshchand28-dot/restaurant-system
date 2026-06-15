// controllers/attendanceController.js
const prisma = require('../config/prisma');

const todayStr = () => new Date().toISOString().split('T')[0];

// GET /api/attendance?date=YYYY-MM-DD
exports.getAll = async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const [records, staff] = await Promise.all([
      prisma.attendance.findMany({ where: { date, restaurantId: req.restaurantId || 1 }, orderBy: { checkIn: 'asc' } }),
      prisma.user.findMany({ where: { active: true, restaurantId: req.restaurantId || 1 }, orderBy: { id: 'asc' } }),
    ]);
    // Merge staff with attendance records
    const result = staff.map(u => {
      const att = records.find(r => r.userId === u.id);
      return {
        userId:     u.id,
        userName:   u.name,
        userRole:   u.role,
        date,
        checkIn:    att?.checkIn    || null,
        checkOut:   att?.checkOut   || null,
        hoursWorked:att?.hoursWorked|| null,
        status:     att?.status     || 'Absent',
        note:       att?.note       || '',
      };
    });
    res.json(result);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/attendance/report?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from) where.date = { gte: from };
    if (to)   where.date = { ...where.date, lte: to };
    const records = await prisma.attendance.findMany({ where, orderBy: [{ date: 'desc' }, { userName: 'asc' }] });
    res.json(records);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/attendance/checkin
exports.checkIn = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const date  = todayStr();
    const now   = new Date();
    // Late if check-in after 09:30
    const shiftStart = new Date(); shiftStart.setHours(9, 30, 0, 0);
    const status = now > shiftStart ? 'Late' : 'Present';

    const record = await prisma.attendance.upsert({
      where:  { userId_date: { userId: parseInt(userId), date } },
      update: { checkIn: now, status },
      create: { userId: parseInt(userId), userName: user.name, userRole: user.role, date, checkIn: now, status },
    });
    res.json({ success: true, record });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/attendance/checkout
exports.checkOut = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const date   = todayStr();
    const record = await prisma.attendance.findUnique({ where: { userId_date: { userId: parseInt(userId), date } } });
    if (!record || !record.checkIn) return res.status(400).json({ success: false, message: 'Check-in not found' });

    const now   = new Date();
    const hours = (now - new Date(record.checkIn)) / 3600000;
    const status = hours < 4 ? 'Half-Day' : record.status;

    const updated = await prisma.attendance.update({
      where: { userId_date: { userId: parseInt(userId), date } },
      data:  { checkOut: now, hoursWorked: Math.round(hours * 10) / 10, status },
    });
    res.json({ success: true, record: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PATCH /api/attendance/:userId — manual override (admin)
exports.update = async (req, res) => {
  try {
    const { date = todayStr(), status, note } = req.body;
    const record = await prisma.attendance.upsert({
      where:  { userId_date: { userId: parseInt(req.params.userId), date } },
      update: { status, note },
      create: { userId: parseInt(req.params.userId), userName: '', userRole: '', date, status: status || 'Absent', note: note || '' },
    });
    res.json({ success: true, record });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
