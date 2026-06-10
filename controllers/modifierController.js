const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all modifier groups (with options)
exports.getAll = async (req, res) => {
  try {
    const groups = await prisma.modifierGroup.findMany({
      include: { options: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    });
    res.json(groups);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET by menu item id (comma-separated menuItemIds field)
exports.getForItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const groups = await prisma.modifierGroup.findMany({
      where: { active: true },
      include: { options: { where: { available: true }, orderBy: { sortOrder: 'asc' } } },
    });
    const filtered = groups.filter(g => {
      const ids = g.menuItemIds.split(',').map(s => s.trim()).filter(Boolean);
      return ids.length === 0 || ids.includes(String(itemId));
    });
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST create group
exports.createGroup = async (req, res) => {
  try {
    const { name, type = 'SINGLE', required = false, minSelect = 0, maxSelect = 1, menuItemIds = '', options = [] } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const group = await prisma.modifierGroup.create({
      data: {
        name, type, required, minSelect, maxSelect, menuItemIds,
        options: {
          create: options.map((o, i) => ({ name: o.name, priceAdjustment: o.priceAdjustment || 0, sortOrder: i })),
        },
      },
      include: { options: true },
    });
    res.json(group);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH update group
exports.updateGroup = async (req, res) => {
  try {
    const { name, type, required, minSelect, maxSelect, menuItemIds, active } = req.body;
    const group = await prisma.modifierGroup.update({
      where: { id: parseInt(req.params.id) },
      data: { name, type, required, minSelect, maxSelect, menuItemIds, active },
      include: { options: true },
    });
    res.json(group);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE group
exports.deleteGroup = async (req, res) => {
  try {
    await prisma.modifierGroup.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST add option to group
exports.addOption = async (req, res) => {
  try {
    const { name, priceAdjustment = 0, sortOrder = 0 } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const option = await prisma.modifierOption.create({
      data: { modifierGroupId: parseInt(req.params.groupId), name, priceAdjustment: parseFloat(priceAdjustment), sortOrder },
    });
    res.json(option);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH option
exports.updateOption = async (req, res) => {
  try {
    const { name, priceAdjustment, available, sortOrder } = req.body;
    const option = await prisma.modifierOption.update({
      where: { id: parseInt(req.params.optionId) },
      data: { name, priceAdjustment: priceAdjustment !== undefined ? parseFloat(priceAdjustment) : undefined, available, sortOrder },
    });
    res.json(option);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE option
exports.deleteOption = async (req, res) => {
  try {
    await prisma.modifierOption.delete({ where: { id: parseInt(req.params.optionId) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
