// controllers/menuController.js
const prisma  = require('../config/prisma');

exports.getAll = async (req, res) => {
  const items = await prisma.menuItem.findMany({ orderBy: { id: 'asc' } });
  res.json(items);
};

exports.getById = async (req, res) => {
  const item = await prisma.menuItem.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  res.json(item);
};

exports.create = async (req, res) => {
  try {
    const { name, price, category, allergens, waitMins, featured, discount } = req.body;
    if (!name || !price || !category)
      return res.status(400).json({ success: false, message: 'name, price, category required' });
    const item = await prisma.menuItem.create({
      data: {
        name, price: parseInt(price), category,
        image:     req.file ? `/uploads/menu/${req.file.filename}` : null,
        available: true,
        allergens: allergens ? JSON.parse(allergens) : [],
        waitMins:  parseInt(waitMins) || 10,
        featured:  featured === 'true',
        discount:  parseInt(discount) || 0,
      },
    });
    res.json({ success: true, item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, price, category, available, allergens, waitMins, featured, discount } = req.body;
    const data = {};
    if (name      !== undefined) data.name      = name;
    if (price     !== undefined) data.price     = parseInt(price);
    if (category  !== undefined) data.category  = category;
    if (available !== undefined) data.available = available === 'true';
    if (featured  !== undefined) data.featured  = featured === 'true';
    if (waitMins  !== undefined) data.waitMins  = parseInt(waitMins);
    if (allergens !== undefined) data.allergens = JSON.parse(allergens);
    if (discount  !== undefined) data.discount  = parseInt(discount);
    if (req.file)                data.image     = `/uploads/menu/${req.file.filename}`;
    const item = await prisma.menuItem.update({ where: { id: parseInt(req.params.id) }, data });
    res.json({ success: true, item });
  } catch (e) { res.status(404).json({ success: false, message: 'Item not found' }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(404).json({ success: false, message: 'Item not found' }); }
};
