const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/menu-engineering?months=3
// Returns each menu item classified as Star / Plow Horse / Puzzle / Dog
exports.getMatrix = async (req, res) => {
  try {
    const months = parseInt(req.query.months || 3);
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    // Sales data
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since } } },
      include: { menuItem: true },
    });

    // Aggregate by menuItem
    const map = {};
    orderItems.forEach(oi => {
      const id = oi.menuItemId || oi.name;
      if (!map[id]) map[id] = { id, name: oi.name || oi.menuItem?.name || 'Unknown', category: oi.menuItem?.category || '', price: oi.price || oi.menuItem?.price || 0, cost: oi.menuItem?.cost || 0, qty: 0, revenue: 0 };
      map[id].qty += oi.quantity || 1;
      map[id].revenue += (oi.price || 0) * (oi.quantity || 1);
    });

    const items = Object.values(map);
    if (!items.length) return res.json({ items: [], avgPopularity: 0, avgMargin: 0 });

    // Add profitability: margin % = (price - cost) / price * 100
    items.forEach(i => {
      i.margin = i.price > 0 ? parseFloat(((i.price - i.cost) / i.price * 100).toFixed(1)) : 0;
      i.profit = i.revenue - (i.cost * i.qty);
    });

    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    const avgPopularity = totalQty / items.length; // items above avg = popular
    const avgMargin = items.reduce((s, i) => s + i.margin, 0) / items.length;

    // Classify
    items.forEach(i => {
      const popular = i.qty >= avgPopularity;
      const profitable = i.margin >= avgMargin;
      if (popular && profitable) i.classification = 'STAR';
      else if (popular && !profitable) i.classification = 'PLOW_HORSE';
      else if (!popular && profitable) i.classification = 'PUZZLE';
      else i.classification = 'DOG';
    });

    items.sort((a, b) => b.qty - a.qty);
    res.json({ items, avgPopularity: parseFloat(avgPopularity.toFixed(1)), avgMargin: parseFloat(avgMargin.toFixed(1)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
