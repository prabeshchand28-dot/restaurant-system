const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all clock entries (with optional date/staff filter)
exports.getAll = async (req, res) => {
  try {
    const { staffId, date, from, to, limit = 100 } = req.query;
    const where = {};
    if (staffId) where.staffId = parseInt(staffId);
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.clockIn = { gte: d, lt: next };
    } else if (from || to) {
      where.clockIn = {};
      if (from) where.clockIn.gte = new Date(from);
      if (to) where.clockIn.lte = new Date(to);
    }
    const entries = await prisma.clockEntry.findMany({
      where,
      orderBy: { clockIn: 'desc' },
      take: parseInt(limit),
    });
    res.json(entries);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST clock in
exports.clockIn = async (req, res) => {
  try {
    const { staffId, staffName, shiftType = 'REGULAR', notes = '' } = req.body;
    if (!staffId) return res.status(400).json({ message: 'staffId required' });

    // Check if already clocked in (no clockOut)
    const open = await prisma.clockEntry.findFirst({
      where: { staffId: parseInt(staffId), clockOut: null },
    });
    if (open) return res.status(400).json({ message: 'Already clocked in', entry: open });

    let name = staffName;
    if (!name) {
      const staff = await prisma.user.findUnique({ where: { id: parseInt(staffId) } });
      name = staff?.name || '';
    }

    const entry = await prisma.clockEntry.create({
      data: { staffId: parseInt(staffId), staffName: name, shiftType, notes },
    });
    res.json(entry);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH clock out
exports.clockOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { breakMinutes = 0, notes } = req.body;

    const entry = await prisma.clockEntry.findUnique({ where: { id: parseInt(id) } });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    if (entry.clockOut) return res.status(400).json({ message: 'Already clocked out' });

    const clockOut = new Date();
    const diffMs = clockOut - entry.clockIn;
    const totalHours = (diffMs / 3600000) - (parseInt(breakMinutes) / 60);
    const hoursWorked = Math.max(0, Math.round(totalHours * 100) / 100);

    const updated = await prisma.clockEntry.update({
      where: { id: parseInt(id) },
      data: { clockOut, hoursWorked, breakMinutes: parseInt(breakMinutes), notes: notes || entry.notes },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    await prisma.clockEntry.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET active (currently clocked in) staff
exports.active = async (req, res) => {
  try {
    const entries = await prisma.clockEntry.findMany({
      where: { clockOut: null },
      orderBy: { clockIn: 'asc' },
    });
    res.json(entries);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET daily summary (hours per staff)
exports.summary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from || to) {
      where.clockIn = {};
      if (from) where.clockIn.gte = new Date(from);
      if (to) where.clockIn.lte = new Date(to + 'T23:59:59');
    }
    const entries = await prisma.clockEntry.findMany({ where, orderBy: { staffId: 'asc' } });

    const byStaff = {};
    entries.forEach(e => {
      if (!byStaff[e.staffId]) byStaff[e.staffId] = { staffId: e.staffId, staffName: e.staffName, totalHours: 0, shifts: 0 };
      byStaff[e.staffId].totalHours += e.hoursWorked || 0;
      byStaff[e.staffId].shifts += 1;
    });
    res.json(Object.values(byStaff).sort((a, b) => b.totalHours - a.totalHours));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
