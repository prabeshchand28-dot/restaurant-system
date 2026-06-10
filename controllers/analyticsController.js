const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Revenue trend — last N months
exports.revenueTrend = async (req, res) => {
  try {
    const months = +req.query.months || 6;
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const [payments, orders, expenses] = await Promise.all([
        prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: start, lt: end } } }),
        prisma.order.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: start.toISOString().slice(0,10), lt: end.toISOString().slice(0,10) } } }),
      ]);
      const revenue  = payments._sum.amount || 0;
      const costs    = expenses._sum.amount || 0;
      result.push({
        month: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
        revenue: Math.round(revenue),
        costs:   Math.round(costs),
        profit:  Math.round(revenue - costs),
        orders,
      });
    }
    res.json(result);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Peak hours heatmap — orders by hour of day
exports.peakHours = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - +days);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true }
    });
    // Count by hour 0-23
    const byHour = Array(24).fill(0);
    orders.forEach(o => { byHour[new Date(o.createdAt).getHours()]++; });
    // Count by day of week 0-6
    const byDay = Array(7).fill(0);
    orders.forEach(o => { byDay[new Date(o.createdAt).getDay()]++; });
    res.json({ byHour: byHour.map((c, h) => ({ hour: h, count: c })), byDay: byDay.map((c, d) => ({ day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d], count: c })) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Best-selling items
exports.bestSellers = async (req, res) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - +days);
    const items = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since } } },
      select: { name: true, quantity: true, price: true }
    });
    const map = {};
    items.forEach(i => {
      if (!map[i.name]) map[i.name] = { name: i.name, qty: 0, revenue: 0 };
      map[i.name].qty      += i.quantity || 1;
      map[i.name].revenue  += (i.price || 0) * (i.quantity || 1);
    });
    const sorted = Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, +limit);
    res.json(sorted);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Category breakdown — revenue by menu category
exports.categoryBreakdown = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(); since.setDate(since.getDate() - +days);
    const items = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since } } },
      select: { name: true, quantity: true, price: true, menuItemId: true }
    });
    // Join with menu for category
    const menu = await prisma.menuItem.findMany({ select: { id: true, category: true } });
    const catMap = Object.fromEntries(menu.map(m => [m.id, m.category || 'Other']));
    const cats = {};
    items.forEach(i => {
      const cat = catMap[i.menuItemId] || 'Other';
      if (!cats[cat]) cats[cat] = { category: cat, qty: 0, revenue: 0 };
      cats[cat].qty     += i.quantity || 1;
      cats[cat].revenue += (i.price || 0) * (i.quantity || 1);
    });
    res.json(Object.values(cats).sort((a, b) => b.revenue - a.revenue));
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Customer metrics
exports.customerMetrics = async (req, res) => {
  try {
    const [totalCustomers, newThisMonth, topSpenders] = await Promise.all([
      prisma.customerProfile.count(),
      prisma.customerProfile.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.customerProfile.findMany({ orderBy: { totalSpend: 'desc' }, take: 5, select: { name: true, phone: true, totalSpend: true, totalVisits: true } }),
    ]);
    const avgSpend = await prisma.customerProfile.aggregate({ _avg: { totalSpend: true, totalVisits: true } });
    res.json({
      totalCustomers, newThisMonth,
      avgSpendPerCustomer: Math.round(avgSpend._avg.totalSpend || 0),
      avgVisitsPerCustomer: Math.round((avgSpend._avg.totalVisits || 0) * 10) / 10,
      topSpenders
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Daily sales — last 7 days
exports.dailySales = async (req, res) => {
  try {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const [rev, cnt] = await Promise.all([
        prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: d, lt: next } } }),
        prisma.order.count({ where: { createdAt: { gte: d, lt: next } } }),
      ]);
      result.push({ date: d.toISOString().slice(0, 10), revenue: Math.round(rev._sum.amount || 0), orders: cnt });
    }
    res.json(result);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
