const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/tasks?status=&assignedToId=&category=&priority=
exports.getAll = async (req, res) => {
  try {
    const { status, assignedToId, category, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = parseInt(assignedToId);
    if (category) where.category = category;
    if (priority) where.priority = priority;
    const tasks = await prisma.internalTask.findMany({ where, orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }] });
    res.json(tasks);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/tasks
exports.create = async (req, res) => {
  try {
    const { title, description, category, priority, assignedToId, assignedBy, dueDate, notes } = req.body;
    if (!title) return res.status(400).json({ message: 'title required' });
    let staffName = '';
    if (assignedToId) {
      const s = await prisma.user.findUnique({ where: { id: parseInt(assignedToId) } });
      staffName = s?.name || '';
    }
    const task = await prisma.internalTask.create({
      data: {
        title, description: description||'',
        category: category||'GENERAL',
        priority: priority||'NORMAL',
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        assignedToName: staffName,
        assignedBy: assignedBy||'',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes||'',
      },
    });
    res.json(task);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/tasks/:id
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, priority, notes, completedBy, dueDate } = req.body;
    const data = {};
    if (status) { data.status = status; if (status === 'DONE') { data.completedAt = new Date(); data.completedBy = completedBy||''; } }
    if (priority) data.priority = priority;
    if (notes !== undefined) data.notes = notes;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    const task = await prisma.internalTask.update({ where: { id }, data });
    res.json(task);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/tasks/:id
exports.remove = async (req, res) => {
  try {
    await prisma.internalTask.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/tasks/stats
exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const [open, inProgress, done, overdue] = await Promise.all([
      prisma.internalTask.count({ where: { status: 'OPEN' } }),
      prisma.internalTask.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.internalTask.count({ where: { status: 'DONE' } }),
      prisma.internalTask.count({ where: { status: { in: ['OPEN','IN_PROGRESS'] }, dueDate: { lt: now } } }),
    ]);
    res.json({ open, inProgress, done, overdue });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
