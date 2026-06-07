// controllers/reportController.js
const prisma  = require('../config/prisma');
const { getDailySummary } = require('../services/reportService');

exports.getSummary = async (req, res) => {
  try {
    const data = await getDailySummary();
    res.json(data);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.exportOrders = async (req, res) => {
  try {
    const period = req.query.period || 'all';
    const now    = new Date();
    let fromDate = null;
    if (period === 'weekly')  fromDate = new Date(now - 7 * 86400000);
    if (period === 'monthly') fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'yearly')  fromDate = new Date(now.getFullYear(), 0, 1);

    const where = fromDate ? { createdAt: { gte: fromDate } } : {};
    const [orders, payments] = await Promise.all([
      prisma.order.findMany({ where, include: { items: true, payment: true }, orderBy: { createdAt: 'desc' } }),
      prisma.payment.findMany({ where: fromDate ? { createdAt: { gte: fromDate } } : {}, orderBy: { createdAt: 'desc' } }),
    ]);

    const orderRows = orders.map(o => ({
      'Order ID':       o.id,
      'Table':          o.tableNumber,
      'Status':         o.status,
      'Items':          o.items.map(i => `${i.name} x${i.qty}`).join(', '),
      'Subtotal (रू)':  o.items.reduce((s, i) => s + i.price * i.qty, 0),
      'VAT 13% (रू)':   Math.round(o.items.reduce((s, i) => s + i.price * i.qty, 0) * 0.13),
      'Total (रू)':     Math.round(o.items.reduce((s, i) => s + i.price * i.qty, 0) * 1.13),
      'Guests':         o.guestCount,
      'Notes':          o.notes || '',
      'Payment Method': o.payment?.method || '—',
      'Paid (रू)':      o.payment?.amountPaid || '—',
      'Change (रू)':    o.payment?.change ?? '—',
      'Receipt No':     o.payment?.receiptNo || '—',
      'Date':           new Date(o.createdAt).toLocaleDateString('en-NP'),
      'Time':           new Date(o.createdAt).toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' }),
    }));

    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
    const byMethod     = payments.reduce((acc, p) => { acc[p.method] = (acc[p.method] || 0) + p.amount; return acc; }, {});

    const summaryRows = [
      { Metric: 'Period',             Value: period },
      { Metric: 'Total Orders',       Value: orders.length },
      { Metric: 'Completed Orders',   Value: orders.filter(o => o.status === 'Completed').length },
      { Metric: 'Total Revenue (रू)', Value: totalRevenue },
      { Metric: 'Avg Bill (रू)',       Value: payments.length ? Math.round(totalRevenue / payments.length) : 0 },
      { Metric: '— Payment Methods —', Value: '' },
      ...Object.entries(byMethod).map(([m, v]) => ({ Metric: m, Value: `रू ${v.toLocaleString()}` })),
    ];

    const itemCount = {};
    orders.forEach(o => o.items.forEach(i => {
      if (!itemCount[i.name]) itemCount[i.name] = { qty: 0, revenue: 0 };
      itemCount[i.name].qty     += i.qty;
      itemCount[i.name].revenue += i.price * i.qty;
    }));
    const topItemRows = Object.entries(itemCount)
      .sort((a, b) => b[1].qty - a[1].qty)
      .map(([name, d], idx) => ({ Rank: idx + 1, Item: name, 'Qty Sold': d.qty, 'Revenue (रू)': d.revenue }));

    res.json({ period, orderRows, summaryRows, topItemRows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
