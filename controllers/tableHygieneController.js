const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLogs = async (req, res) => {
  try {
    const { tableNumber, type, from, to } = req.query;
    const where = {};
    if (tableNumber) where.tableNumber = Number(tableNumber);
    if (type) where.type = type;
    if (from || to) {
      where.cleanedAt = {};
      if (from) where.cleanedAt.gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); where.cleanedAt.lte = d; }
    }
    const logs = await prisma.tableCleaningLog.findMany({ where, orderBy: { cleanedAt: 'desc' }, take: 500 });
    res.json(logs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.logCleaning = async (req, res) => {
  try {
    const { tableNumber, cleanedBy, type, duration, notes } = req.body;
    if (!tableNumber || !cleanedBy) return res.status(400).json({ message: 'Table number and staff name required' });
    const log = await prisma.tableCleaningLog.create({
      data: {
        tableNumber: Number(tableNumber),
        cleanedBy,
        type: type || 'STANDARD',
        duration: duration ? Number(duration) : 0,
        notes: notes || '',
      },
    });
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteLog = async (req, res) => {
  try {
    await prisma.tableCleaningLog.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Status board: last cleaning per table
exports.statusBoard = async (req, res) => {
  try {
    // Get all unique table numbers
    const all = await prisma.tableCleaningLog.findMany({ orderBy: { cleanedAt: 'desc' } });
    const latest = {};
    all.forEach(log => {
      if (!latest[log.tableNumber]) latest[log.tableNumber] = log;
    });
    // Also get restaurant tables
    const tables = await prisma.restaurantTable.findMany({ where: { active: true }, orderBy: { number: 'asc' } });
    const board = tables.map(t => ({
      tableNumber: t.number,
      capacity: t.capacity,
      lastCleaned: latest[t.number] || null,
    }));
    res.json(board);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const [totalToday, deepToday, byType] = await Promise.all([
      prisma.tableCleaningLog.count({ where: { cleanedAt: { gte: today } } }),
      prisma.tableCleaningLog.count({ where: { cleanedAt: { gte: today }, type: 'DEEP' } }),
      prisma.tableCleaningLog.groupBy({ by: ['type'], _count: { id: true }, where: { cleanedAt: { gte: today } } }),
    ]);
    const typeMap = {};
    byType.forEach(r => { typeMap[r.type] = r._count.id; });
    res.json({ totalToday, deepToday, byType: typeMap });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
