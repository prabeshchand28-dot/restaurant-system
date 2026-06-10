const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const { date, active } = req.query;
    const where = {};
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    if (active !== undefined) where.active = active === 'true';
    const specials = await prisma.dailySpecial.findMany({ where, orderBy: { date: 'desc' } });
    res.json(specials);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const specials = await prisma.dailySpecial.findMany({
      where: { date: { gte: today, lt: tomorrow }, active: true },
      orderBy: { mealType: 'asc' },
    });
    res.json(specials);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { itemName, description = '', originalPrice = 0, specialPrice, availableQty, mealType = 'ALL', date, menuItemId } = req.body;
    if (!itemName || !specialPrice) return res.status(400).json({ message: 'itemName and specialPrice required' });
    const special = await prisma.dailySpecial.create({
      data: {
        itemName, description, originalPrice: parseFloat(originalPrice), specialPrice: parseFloat(specialPrice),
        availableQty: availableQty ? parseInt(availableQty) : null,
        mealType, date: date ? new Date(date) : new Date(),
        menuItemId: menuItemId ? parseInt(menuItemId) : null,
      },
    });
    res.json(special);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.originalPrice !== undefined) data.originalPrice = parseFloat(data.originalPrice);
    if (data.specialPrice !== undefined) data.specialPrice = parseFloat(data.specialPrice);
    if (data.availableQty !== undefined) data.availableQty = data.availableQty ? parseInt(data.availableQty) : null;
    if (data.date) data.date = new Date(data.date);
    const special = await prisma.dailySpecial.update({ where: { id: parseInt(req.params.id) }, data });
    res.json(special);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.dailySpecial.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
