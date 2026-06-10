const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── MODULES ──────────────────────────────────
exports.getModules = async (req, res) => {
  try {
    const modules = await prisma.trainingModule.findMany({ include: { _count: { select: { records: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(modules);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createModule = async (req, res) => {
  try {
    const { title, category, description, durationMin, mandatory } = req.body;
    if (!title) return res.status(400).json({ message: 'title required' });
    const mod = await prisma.trainingModule.create({ data: { title, category: category||'GENERAL', description: description||'', durationMin: parseInt(durationMin||30), mandatory: !!mandatory } });
    res.json(mod);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteModule = async (req, res) => {
  try {
    await prisma.trainingModule.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── RECORDS (assignments) ─────────────────────
exports.getRecords = async (req, res) => {
  try {
    const { staffId, moduleId, status } = req.query;
    const where = {};
    if (staffId) where.staffId = parseInt(staffId);
    if (moduleId) where.moduleId = parseInt(moduleId);
    if (status) where.status = status;
    const records = await prisma.trainingRecord.findMany({ where, include: { module: true }, orderBy: { createdAt: 'desc' } });
    res.json(records);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/training/assign  — assign module to staff
exports.assign = async (req, res) => {
  try {
    const { moduleId, staffIds, assignedBy, expiresAt } = req.body;
    if (!moduleId || !staffIds?.length) return res.status(400).json({ message: 'moduleId and staffIds required' });
    const staffList = await prisma.user.findMany({ where: { id: { in: staffIds.map(Number) } } });
    const nameMap = Object.fromEntries(staffList.map(s => [s.id, s.name]));
    const results = [];
    for (const sid of staffIds) {
      const rec = await prisma.trainingRecord.upsert({
        where: { moduleId_staffId: { moduleId: parseInt(moduleId), staffId: parseInt(sid) } },
        update: { status: 'PENDING', assignedBy: assignedBy||'', expiresAt: expiresAt?new Date(expiresAt):null },
        create: { moduleId: parseInt(moduleId), staffId: parseInt(sid), staffName: nameMap[parseInt(sid)]||'', assignedBy: assignedBy||'', expiresAt: expiresAt?new Date(expiresAt):null },
      });
      results.push(rec);
    }
    res.json(results);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/training/records/:id
exports.updateRecord = async (req, res) => {
  try {
    const { status, score, notes } = req.body;
    const data = {};
    if (status) { data.status = status; if (status==='COMPLETED') data.completedAt = new Date(); }
    if (score !== undefined) data.score = parseInt(score);
    if (notes) data.notes = notes;
    const rec = await prisma.trainingRecord.update({ where: { id: parseInt(req.params.id) }, data });
    res.json(rec);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/training/stats
exports.stats = async (req, res) => {
  try {
    const [total, completed, pending, overdue] = await Promise.all([
      prisma.trainingRecord.count(),
      prisma.trainingRecord.count({ where: { status: 'COMPLETED' } }),
      prisma.trainingRecord.count({ where: { status: 'PENDING' } }),
      prisma.trainingRecord.count({ where: { expiresAt: { lt: new Date() }, status: { not: 'COMPLETED' } } }),
    ]);
    res.json({ total, completed, pending, overdue, pct: total ? Math.round(completed/total*100) : 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
