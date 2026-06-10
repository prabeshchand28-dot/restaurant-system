const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getChecklists = async (req, res) => {
  try {
    const { date, shift, type, status } = req.query;
    const where = {};
    if (shift) where.shift = shift;
    if (type) where.checklistType = type;
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    const lists = await prisma.prepChecklist.findMany({ where, orderBy: { date: 'desc' } });
    res.json(lists.map(l => ({ ...l, items: JSON.parse(l.items || '[]') })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createChecklist = async (req, res) => {
  try {
    const { name, checklistType, shift, date, items, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    const itemArr = Array.isArray(items) ? items : [{ label: 'Item 1', done: false }];
    const c = await prisma.prepChecklist.create({
      data: { name, checklistType: checklistType || 'OPENING', shift: shift || 'MORNING', date: date ? new Date(date) : new Date(), items: JSON.stringify(itemArr), notes: notes || '' }
    });
    res.json({ ...c, items: itemArr });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateChecklist = async (req, res) => {
  try {
    const { items, status, completedBy, notes } = req.body;
    const data = {};
    if (items !== undefined) data.items = JSON.stringify(items);
    if (status) data.status = status;
    if (completedBy !== undefined) data.completedBy = completedBy;
    if (notes !== undefined) data.notes = notes;
    if (status === 'COMPLETED') data.completedAt = new Date();
    const c = await prisma.prepChecklist.update({ where: { id: Number(req.params.id) }, data });
    res.json({ ...c, items: JSON.parse(c.items || '[]') });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteChecklist = async (req, res) => {
  try {
    await prisma.prepChecklist.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const [todayTotal, todayDone, pending, total] = await Promise.all([
      prisma.prepChecklist.count({ where: { date: { gte: today, lt: tomorrow } } }),
      prisma.prepChecklist.count({ where: { date: { gte: today, lt: tomorrow }, status: 'COMPLETED' } }),
      prisma.prepChecklist.count({ where: { status: 'PENDING' } }),
      prisma.prepChecklist.count(),
    ]);
    res.json({ todayTotal, todayDone, todayPending: todayTotal - todayDone, pending, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
