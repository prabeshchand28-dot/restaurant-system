const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getCategories = async (req, res) => {
  try {
    const cats = await prisma.menuCategory.findMany({ orderBy: { displayOrder: 'asc' } });
    res.json(cats);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, displayOrder, icon, color, description } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    const c = await prisma.menuCategory.create({
      data: { name, displayOrder: Number(displayOrder) || 0, icon: icon || '🍽️', color: color || '#2653a0', description: description || '' }
    });
    res.json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, displayOrder, icon, color, description, active } = req.body;
    const c = await prisma.menuCategory.update({
      where: { id: Number(req.params.id) },
      data: { ...(name && { name }), ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }), ...(icon && { icon }), ...(color && { color }), ...(description !== undefined && { description }), ...(active !== undefined && { active: !!active }) }
    });
    res.json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.reorder = async (req, res) => {
  try {
    // [{id, displayOrder}]
    const { order } = req.body;
    await Promise.all(order.map(o => prisma.menuCategory.update({ where: { id: o.id }, data: { displayOrder: o.displayOrder } })));
    res.json({ message: 'Reordered' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteCategory = async (req, res) => {
  try {
    await prisma.menuCategory.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
