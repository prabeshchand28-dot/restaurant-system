const prisma = require('../config/prisma');

exports.getPL = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    const where = month ? { createdAt: { gte: new Date(`${month}-01`), lt: new Date(`${month}-31`) } } : {};
    const expWhere = month ? { date: { gte: `${month}-01`, lte: `${month}-31` } } : {};

    const [payments, expenses, payrolls] = await Promise.all([
      prisma.payment.findMany({ where }),
      prisma.expense.findMany({ where: expWhere }),
      month ? prisma.payroll.findMany({ where: { month } }) : Promise.resolve([]),
    ]);

    const revenue = payments.reduce((s, p) => s + p.amount, 0);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const payrollTotal = payrolls.reduce((s, p) => s + p.netPay, 0);
    const totalCosts = expenseTotal + payrollTotal;
    const grossProfit = revenue - expenseTotal;
    const netProfit = revenue - totalCosts;
    const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

    const expByCategory = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category]||0) + e.amount; return acc; }, {});
    const revenueByMethod = payments.reduce((acc, p) => { acc[p.method] = (acc[p.method]||0) + p.amount; return acc; }, {});

    res.json({
      month: month || 'All',
      revenue, expenseTotal, payrollTotal, totalCosts,
      grossProfit, netProfit, margin,
      transactionCount: payments.length,
      expByCategory, revenueByMethod,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getCashFlow = async (req, res) => {
  try {
    // Last 6 months breakdown
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }

    const data = await Promise.all(months.map(async m => {
      const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({ where: { createdAt: { gte: new Date(`${m}-01`), lt: new Date(`${m}-31`) } } }),
        prisma.expense.findMany({ where: { date: { gte: `${m}-01`, lte: `${m}-31` } } }),
      ]);
      const revenue = payments.reduce((s, p) => s + p.amount, 0);
      const costs = expenses.reduce((s, e) => s + e.amount, 0);
      return { month: m, revenue, costs, net: revenue - costs };
    }));

    res.json(data);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const payments = await prisma.payment.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'asc' } });

    // Daily revenue
    const daily = {};
    payments.forEach(p => {
      const d = p.createdAt.toISOString().slice(0, 10);
      daily[d] = (daily[d] || 0) + p.amount;
    });

    const total = payments.reduce((s, p) => s + p.amount, 0);
    const avg = payments.length > 0 ? Math.round(total / payments.length) : 0;
    const peak = Object.entries(daily).sort((a, b) => b[1] - a[1])[0];
    const byMethod = payments.reduce((acc, p) => { acc[p.method] = (acc[p.method]||0) + p.amount; return acc; }, {});

    res.json({ total, avg, count: payments.length, peak: peak ? { date: peak[0], amount: peak[1] } : null, daily, byMethod });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.exportCSV = async (req, res) => {
  try {
    const { type, month } = req.query;
    let rows = [], headers = [];

    if (type === 'payments') {
      const where = month ? { createdAt: { gte: new Date(`${month}-01`), lt: new Date(`${month}-31`) } } : {};
      const data = await prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' } });
      headers = ['ID', 'Order ID', 'Method', 'Amount', 'Amount Paid', 'Change', 'Receipt No', 'Date'];
      rows = data.map(p => [p.id, p.orderId, p.method, p.amount, p.amountPaid, p.change, p.receiptNo, p.createdAt.toISOString().slice(0,10)]);
    } else if (type === 'expenses') {
      const where = month ? { date: { gte: `${month}-01`, lte: `${month}-31` } } : {};
      const data = await prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
      headers = ['ID', 'Category', 'Description', 'Amount', 'Date', 'Payment Mode', 'Receipt Ref'];
      rows = data.map(e => [e.id, e.category, e.description, e.amount, e.date, e.paymentMode, e.receiptRef]);
    } else if (type === 'customers') {
      const data = await prisma.customerProfile.findMany({ orderBy: { visitCount: 'desc' } });
      headers = ['ID', 'Name', 'Phone', 'Email', 'Visits', 'Total Spent', 'Segment', 'Last Visit'];
      rows = data.map(c => [c.id, c.name, c.phone, c.email, c.visitCount, c.totalSpent, c.segment, c.lastVisit?.toISOString().slice(0,10)||'']);
    } else if (type === 'inventory') {
      const data = await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } });
      headers = ['ID', 'Name', 'Quantity', 'Unit', 'Min Stock', 'Category', 'Status'];
      rows = data.map(i => [i.id, i.name, i.quantity, i.unit, i.minStock, i.category, i.quantity <= i.minStock ? 'Low Stock' : 'OK']);
    } else {
      return res.status(400).json({ success: false, message: 'type must be: payments, expenses, customers, inventory' });
    }

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${month||'all'}.csv"`);
    res.send(csv);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
