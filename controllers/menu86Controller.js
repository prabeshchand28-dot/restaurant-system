const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all 86'd items (unavailable)
exports.get86Board = async (req, res) => {
  try {
    const unavailable = await prisma.menuItemAvailability.findMany({
      where: { available: false },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(unavailable);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Toggle a menu item's availability
exports.toggleItem = async (req, res) => {
  try {
    const { menuItemId, available, reason, updatedBy } = req.body;
    if (!menuItemId) return res.status(400).json({ message: 'menuItemId required' });
    const record = await prisma.menuItemAvailability.upsert({
      where: { menuItemId: Number(menuItemId) },
      update: { available: available !== false, reason: reason || '', updatedBy: updatedBy || '' },
      create: { menuItemId: Number(menuItemId), available: available !== false, reason: reason || '', updatedBy: updatedBy || '' },
    });
    res.json(record);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Mark as available again (un-86)
exports.restore = async (req, res) => {
  try {
    const { updatedBy } = req.body;
    const record = await prisma.menuItemAvailability.update({
      where: { id: Number(req.params.id) },
      data: { available: true, reason: '', updatedBy: updatedBy || '' },
    });
    res.json(record);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Get menu items with their availability status
exports.getMenuWithAvailability = async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
    const unavailable = await prisma.menuItemAvailability.findMany({ where: { available: false } });
    const unavailableIds = new Set(unavailable.map(u => u.menuItemId));
    const unavailableMap = {};
    unavailable.forEach(u => { unavailableMap[u.menuItemId] = u; });
    const result = menuItems.map(m => ({
      ...m,
      available: !unavailableIds.has(m.id),
      availabilityRecord: unavailableMap[m.id] || null,
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
