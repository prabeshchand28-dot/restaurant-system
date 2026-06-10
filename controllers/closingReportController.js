const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate today's closing report data (live calculation)
exports.generate = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().slice(0, 10);
    const start = new Date(reportDate + 'T00:00:00.000Z');
    const end   = new Date(reportDate + 'T23:59:59.999Z');

    const [orders, payments, expenses] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gte: start, lte: end } }, include: { items: true } }),
      prisma.payment.findMany({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.expense.findMany({ where: { date: reportDate } }),
    ]);

    const totalRevenue   = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalExpenses  = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit      = totalRevenue - totalExpenses;
    const cashSales      = payments.filter(p => p.method === 'CASH').reduce((s, p) => s + (p.amount || 0), 0);
    const cardSales      = payments.filter(p => p.method !== 'CASH').reduce((s, p) => s + (p.amount || 0), 0);

    // Top selling items
    const itemCounts = {};
    orders.forEach(o => o.items.forEach(i => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + (i.quantity || 1);
    }));
    const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));

    // Category breakdown
    const byCategory = payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + (p.amount || 0);
      return acc;
    }, {});

    // Expense by category
    const expByCategory = expenses.reduce((acc, e) => {
      acc[e.category || 'Other'] = (acc[e.category || 'Other'] || 0) + (e.amount || 0);
      return acc;
    }, {});

    const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

    res.json({
      date: reportDate,
      totalOrders: orders.length,
      totalRevenue,
      totalExpenses,
      netProfit,
      cashSales,
      cardSales,
      topItems,
      byPaymentMethod: byCategory,
      expByCategory,
      avgOrderValue: Math.round(avgOrderValue),
      transactionCount: payments.length,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Save closing report
exports.save = async (req, res) => {
  try {
    const { date, totalOrders, totalRevenue, totalExpenses, netProfit, cashSales, cardSales, topItems, notes, closedBy } = req.body;
    if (!date) return res.status(400).json({ message: 'date required' });
    const report = await prisma.closingReport.upsert({
      where: { date },
      create: { date, totalOrders: +totalOrders || 0, totalRevenue: +totalRevenue || 0, totalExpenses: +totalExpenses || 0, netProfit: +netProfit || 0, cashSales: +cashSales || 0, cardSales: +cardSales || 0, topItems: JSON.stringify(topItems || []), notes: notes || '', closedBy: closedBy || '' },
      update: { totalOrders: +totalOrders || 0, totalRevenue: +totalRevenue || 0, totalExpenses: +totalExpenses || 0, netProfit: +netProfit || 0, cashSales: +cashSales || 0, cardSales: +cardSales || 0, topItems: JSON.stringify(topItems || []), notes: notes || '', closedBy: closedBy || '' }
    });
    res.json(report);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Get saved reports
exports.getAll = async (req, res) => {
  try {
    const reports = await prisma.closingReport.findMany({ orderBy: { date: 'desc' }, take: 30 });
    res.json(reports.map(r => ({ ...r, topItems: (() => { try { return JSON.parse(r.topItems); } catch { return []; } })() })));
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const r = await prisma.closingReport.findUnique({ where: { date: req.params.date } });
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json({ ...r, topItems: (() => { try { return JSON.parse(r.topItems); } catch { return []; } })() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
