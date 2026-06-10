const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get stock history (all or by item)
exports.getHistory = async (req, res) => {
  try {
    const { itemId, limit = 100 } = req.query;
    const where = itemId ? { inventoryItemId: +itemId } : {};
    const history = await prisma.stockHistory.findMany({
      where, orderBy: { createdAt: 'desc' }, take: +limit
    });
    // Attach item names
    const items = await prisma.inventoryItem.findMany({ select: { id: true, name: true, unit: true } });
    const itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    res.json(history.map(h => ({ ...h, item: itemMap[h.inventoryItemId] || null })));
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Log a manual stock adjustment
exports.adjust = async (req, res) => {
  try {
    const { inventoryItemId, change, reason, staffName, changeType } = req.body;
    if (!inventoryItemId || change === undefined) return res.status(400).json({ message: 'inventoryItemId and change required' });
    const item = await prisma.inventoryItem.findUnique({ where: { id: +inventoryItemId } });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const before = item.quantity;
    const after  = before + +change;
    // Update stock
    await prisma.inventoryItem.update({ where: { id: +inventoryItemId }, data: { quantity: after } });
    // Log history
    const entry = await prisma.stockHistory.create({
      data: { inventoryItemId: +inventoryItemId, changeType: changeType || (change > 0 ? 'ADD' : 'REMOVE'), quantityBefore: before, quantityAfter: after, change: +change, reason: reason || '', staffName: staffName || '' }
    });
    res.json({ entry, newQuantity: after });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Get items below reorder point (low stock alerts)
exports.getLowStock = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } });
    const low = items.filter(i => i.reorderPoint && i.quantity <= i.reorderPoint);
    res.json(low);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Set reorder point for an item
exports.setReorderPoint = async (req, res) => {
  try {
    const { reorderPoint } = req.body;
    const item = await prisma.inventoryItem.update({
      where: { id: +req.params.id },
      data: { reorderPoint: +reorderPoint }
    });
    res.json(item);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Stock summary
exports.getSummary = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany();
    const totalItems = items.length;
    const lowStock = items.filter(i => i.reorderPoint && i.quantity <= i.reorderPoint).length;
    const outOfStock = items.filter(i => i.quantity <= 0).length;
    const totalValue = items.reduce((s, i) => s + (i.quantity * (i.costPerUnit || 0)), 0);
    res.json({ totalItems, lowStock, outOfStock, totalValue: Math.round(totalValue) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
