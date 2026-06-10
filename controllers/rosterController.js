const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Normalize to Monday of week containing `date`
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/roster?weekStart=2024-06-10
exports.getWeek = async (req, res) => {
  try {
    const weekStart = req.query.weekStart ? new Date(req.query.weekStart) : getMonday(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const entries = await prisma.rosterEntry.findMany({
      where: { weekStart: { gte: weekStart, lt: weekEnd } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json({ weekStart: weekStart.toISOString().slice(0, 10), entries });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/roster  — upsert single entry
exports.upsert = async (req, res) => {
  try {
    const { staffId, weekStart, dayOfWeek, startTime, endTime, role, note } = req.body;
    if (!staffId || weekStart === undefined || dayOfWeek === undefined || !startTime || !endTime)
      return res.status(400).json({ message: 'staffId, weekStart, dayOfWeek, startTime, endTime required' });

    const monday = getMonday(weekStart);
    const entry = await prisma.rosterEntry.upsert({
      where: { staffId_weekStart_dayOfWeek: { staffId: parseInt(staffId), weekStart: monday, dayOfWeek: parseInt(dayOfWeek) } },
      update: { startTime, endTime, role: role || '', note: note || '' },
      create: {
        staffId: parseInt(staffId), weekStart: monday,
        dayOfWeek: parseInt(dayOfWeek), startTime, endTime,
        role: role || '', note: note || '',
      },
    });
    res.json(entry);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/roster/:id
exports.remove = async (req, res) => {
  try {
    await prisma.rosterEntry.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/roster/publish  — mark all entries for a week as published
exports.publish = async (req, res) => {
  try {
    const monday = getMonday(req.body.weekStart || new Date());
    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const result = await prisma.rosterEntry.updateMany({
      where: { weekStart: { gte: monday, lt: weekEnd } },
      data: { published: true },
    });
    res.json({ published: result.count });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/roster/copy — copy previous week's roster to target week
exports.copyWeek = async (req, res) => {
  try {
    const { fromWeek, toWeek } = req.body;
    const fromMonday = getMonday(fromWeek);
    const fromEnd = new Date(fromMonday); fromEnd.setDate(fromEnd.getDate() + 7);
    const toMonday = getMonday(toWeek);

    const entries = await prisma.rosterEntry.findMany({
      where: { weekStart: { gte: fromMonday, lt: fromEnd } },
    });

    let copied = 0;
    for (const e of entries) {
      await prisma.rosterEntry.upsert({
        where: { staffId_weekStart_dayOfWeek: { staffId: e.staffId, weekStart: toMonday, dayOfWeek: e.dayOfWeek } },
        update: { startTime: e.startTime, endTime: e.endTime, role: e.role, note: e.note, published: false },
        create: { staffId: e.staffId, weekStart: toMonday, dayOfWeek: e.dayOfWeek, startTime: e.startTime, endTime: e.endTime, role: e.role, note: e.note, published: false },
      });
      copied++;
    }
    res.json({ copied });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
