const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const { from, to, shiftType, limit = 50 } = req.query;
    const where = {};
    if (shiftType) where.shiftType = shiftType;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to + 'T23:59:59');
    }
    const records = await prisma.shiftHandover.findMany({
      where,
      orderBy: { date: 'desc' },
      take: parseInt(limit),
    });
    res.json(records);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getLatest = async (req, res) => {
  try {
    const record = await prisma.shiftHandover.findFirst({ orderBy: { date: 'desc' } });
    res.json(record || null);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      shiftType = 'LUNCH', writtenBy = '', cashFloat = 0, coversServed = 0, totalRevenue = 0,
      incidents = '', pendingTasks = '', stockAlerts = '', generalNotes = '',
    } = req.body;
    if (!writtenBy) return res.status(400).json({ message: 'writtenBy required' });
    const record = await prisma.shiftHandover.create({
      data: {
        shiftType, writtenBy, cashFloat: parseFloat(cashFloat), coversServed: parseInt(coversServed),
        totalRevenue: parseFloat(totalRevenue), incidents, pendingTasks, stockAlerts, generalNotes,
      },
    });
    res.json(record);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH acknowledge (add name to readBy)
exports.acknowledge = async (req, res) => {
  try {
    const { name } = req.body;
    const record = await prisma.shiftHandover.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!record) return res.status(404).json({ message: 'Not found' });
    const readers = record.readBy ? record.readBy.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (!readers.includes(name)) readers.push(name);
    const updated = await prisma.shiftHandover.update({
      where: { id: parseInt(req.params.id) },
      data: { readBy: readers.join(', '), readAt: new Date() },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.shiftHandover.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
