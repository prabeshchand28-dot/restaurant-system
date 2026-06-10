const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/waste?from=&to=&reason=
exports.getAll = async (req, res) => {
  try {
    const { from, to, reason } = req.query;
    const where = {};
    if (reason) where.reason = reason;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); where.date.lte = d; }
    }
    const logs = await prisma.wasteLog.findMany({ where, orderBy: { date: 'desc' } });
    res.json(logs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/waste
exports.create = async (req, res) => {
  try {
    const { menuItemId, itemName, category, quantity, unit, reason, costPerUnit, staffName, notes, date } = req.body;
    if (!itemName || !quantity) return res.status(400).json({ message: 'itemName and quantity required' });
    const cost = parseFloat(costPerUnit || 0);
    const qty  = parseFloat(quantity);
    const log = await prisma.wasteLog.create({
      data: {
        menuItemId: menuItemId ? parseInt(menuItemId) : null,
        itemName, category: category || '',
        quantity: qty, unit: unit || 'portion',
        reason: reason || 'SPOILAGE',
        costPerUnit: cost,
        totalCost: cost * qty,
        staffName: staffName || '',
        notes: notes || '',
        date: date ? new Date(date) : new Date(),
      }
    });
    res.json(log);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/waste/:id
exports.remove = async (req, res) => {
  try {
    await prisma.wasteLog.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/waste/summary?months=3
exports.summary = async (req, res) => {
  try {
    const months = parseInt(req.query.months || 3);
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const logs = await prisma.wasteLog.findMany({ where: { date: { gte: since } } });

    const totalCost = logs.reduce((s, l) => s + (l.totalCost || 0), 0);
    const totalItems = logs.length;

    // By reason
    const byReason = {};
    logs.forEach(l => {
      if (!byReason[l.reason]) byReason[l.reason] = { count: 0, cost: 0 };
      byReason[l.reason].count++;
      byReason[l.reason].cost += l.totalCost || 0;
    });

    // By item
    const byItem = {};
    logs.forEach(l => {
      if (!byItem[l.itemName]) byItem[l.itemName] = { count: 0, cost: 0, qty: 0 };
      byItem[l.itemName].count++;
      byItem[l.itemName].cost += l.totalCost || 0;
      byItem[l.itemName].qty  += l.quantity || 0;
    });
    const topItems = Object.entries(byItem)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    // Monthly trend
    const monthly = {};
    logs.forEach(l => {
      const key = l.date.toISOString().slice(0, 7);
      if (!monthly[key]) monthly[key] = { month: key, cost: 0, count: 0 };
      monthly[key].cost  += l.totalCost || 0;
      monthly[key].count++;
    });

    res.json({ totalCost, totalItems, byReason, topItems, monthly: Object.values(monthly).sort((a,b)=>a.month.localeCompare(b.month)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
