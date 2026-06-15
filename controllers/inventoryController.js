// controllers/inventoryController.js
const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  const items = await prisma.inventoryItem.findMany({ where: { restaurantId: req.restaurantId || 1 }, orderBy: { id: 'asc' } });
  res.json(items);
};

exports.create = async (req, res) => {
  try {
    const { name, quantity, unit, minStock, category } = req.body;
    if (!name || quantity === undefined || !unit)
      return res.status(400).json({ success: false, message: 'name, quantity, unit required' });
    const item = await prisma.inventoryItem.create({
      data: { restaurantId: req.restaurantId || 1, name, quantity: parseFloat(quantity), unit, minStock: parseFloat(minStock) || 0, category: category || 'General' },
    });
    res.json({ success: true, item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = {};
    if (req.body.name     !== undefined) data.name     = req.body.name;
    if (req.body.quantity !== undefined) data.quantity = parseFloat(req.body.quantity);
    if (req.body.unit     !== undefined) data.unit     = req.body.unit;
    if (req.body.minStock !== undefined) data.minStock = parseFloat(req.body.minStock);
    if (req.body.category !== undefined) data.category = req.body.category;
    const item = await prisma.inventoryItem.update({ where: { id: parseInt(req.params.id) }, data });
    res.json({ success: true, item });
  } catch (e) { res.status(404).json({ success: false, message: 'Item not found' }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(404).json({ success: false, message: 'Item not found' }); }
};
