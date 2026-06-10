const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const taxes = await prisma.taxRate.findMany({ orderBy: { name: 'asc' } });
    res.json(taxes);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, rate, category, inclusive } = req.body;
    if (!name || rate === undefined) return res.status(400).json({ message: 'name and rate required' });
    const tax = await prisma.taxRate.create({
      data: { name, rate: +rate, category: category || 'ALL', inclusive: !!inclusive }
    });
    res.json(tax);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const tax = await prisma.taxRate.update({ where: { id: +req.params.id }, data: req.body });
    res.json(tax);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.toggle = async (req, res) => {
  try {
    const t = await prisma.taxRate.findUnique({ where: { id: +req.params.id } });
    const updated = await prisma.taxRate.update({ where: { id: +req.params.id }, data: { active: !t.active } });
    res.json(updated);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.taxRate.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Tax report: calculate collected tax from payments in a date range
exports.getReport = async (req, res) => {
  try {
    const { month } = req.query;
    let where = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end   = new Date(y, m, 1);
      where.createdAt = { gte: start, lt: end };
    }
    const payments = await prisma.payment.findMany({ where, select: { amount: true, method: true, createdAt: true } });
    const taxes = await prisma.taxRate.findMany({ where: { active: true } });

    const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const taxBreakdown = taxes.map(t => {
      const applicable = t.category === 'ALL' ? totalRevenue : totalRevenue * 0.6; // estimate for categories
      const taxAmount = t.inclusive
        ? applicable - applicable / (1 + t.rate / 100)
        : applicable * t.rate / 100;
      return { ...t, taxAmount: Math.round(taxAmount * 100) / 100, taxableAmount: applicable };
    });

    const byMethod = payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + (p.amount || 0);
      return acc;
    }, {});

    res.json({ totalRevenue, taxBreakdown, byMethod, transactionCount: payments.length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Quick calculate
exports.calculate = async (req, res) => {
  try {
    const { amount, category } = req.body;
    const taxes = await prisma.taxRate.findMany({ where: { active: true } });
    const applicable = taxes.filter(t => t.category === 'ALL' || t.category === category);
    const breakdown = applicable.map(t => {
      const taxAmt = t.inclusive
        ? +amount - +amount / (1 + t.rate / 100)
        : +amount * t.rate / 100;
      return { name: t.name, rate: t.rate, taxAmount: Math.round(taxAmt * 100) / 100, inclusive: t.inclusive };
    });
    const totalTax = breakdown.reduce((s, t) => s + t.taxAmount, 0);
    const totalWithTax = applicable.some(t => !t.inclusive) ? +amount + totalTax : +amount;
    res.json({ subtotal: +amount, breakdown, totalTax: Math.round(totalTax * 100) / 100, totalWithTax: Math.round(totalWithTax * 100) / 100 });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
