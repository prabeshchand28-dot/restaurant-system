const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = ['FOOD_COST','LABOR','UTILITIES','MARKETING','MAINTENANCE','RENT','OTHER'];

// GET /api/budget?month=YYYY-MM
exports.getMonth = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0,7);
    const plans = await prisma.budgetPlan.findMany({ where: { month } });
    // Get actual expenses for the month
    const [y, m] = month.split('-').map(Number);
    const from = new Date(y, m-1, 1);
    const to   = new Date(y, m, 1);
    const expenses = await prisma.expense.findMany({ where: { date: { gte: from, lt: to } } });
    // Map expense categories
    const actuals = {};
    expenses.forEach(e => {
      const cat = mapExpCat(e.category);
      actuals[cat] = (actuals[cat] || 0) + (e.amount || 0);
    });
    // Also get payroll for labor
    const payroll = await prisma.payroll.findMany({ where: { month } });
    actuals['LABOR'] = (actuals['LABOR'] || 0) + payroll.reduce((s,p)=>s+(p.netPay||0),0);

    const result = CATEGORIES.map(cat => {
      const plan = plans.find(p => p.category === cat);
      const budgeted = plan?.budgeted || 0;
      const actual = actuals[cat] || 0;
      return { category: cat, budgeted, actual, variance: budgeted - actual, pct: budgeted ? Math.round(actual/budgeted*100) : null };
    });
    res.json({ month, categories: result, totalBudget: result.reduce((s,c)=>s+c.budgeted,0), totalActual: result.reduce((s,c)=>s+c.actual,0) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

function mapExpCat(cat='') {
  const c = cat.toUpperCase();
  if (c.includes('FOOD') || c.includes('INGREDIENT') || c.includes('BEVERAGE')) return 'FOOD_COST';
  if (c.includes('STAFF') || c.includes('LABOR') || c.includes('WAGE') || c.includes('SALARY')) return 'LABOR';
  if (c.includes('UTIL') || c.includes('ELECTRIC') || c.includes('WATER') || c.includes('GAS')) return 'UTILITIES';
  if (c.includes('MARKET') || c.includes('ADS') || c.includes('PROMO')) return 'MARKETING';
  if (c.includes('MAINT') || c.includes('REPAIR') || c.includes('CLEAN')) return 'MAINTENANCE';
  if (c.includes('RENT')) return 'RENT';
  return 'OTHER';
}

// POST /api/budget — upsert a category budget for a month
exports.upsert = async (req, res) => {
  try {
    const { month, category, budgeted, notes } = req.body;
    if (!month || !category) return res.status(400).json({ message: 'month and category required' });
    const plan = await prisma.budgetPlan.upsert({
      where: { month_category: { month, category } },
      update: { budgeted: parseFloat(budgeted||0), notes: notes||'' },
      create: { month, category, budgeted: parseFloat(budgeted||0), notes: notes||'' },
    });
    res.json(plan);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/budget/trend?months=6
exports.trend = async (req, res) => {
  try {
    const months = parseInt(req.query.months||6);
    const result = [];
    for (let i = months-1; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth()-i);
      const month = d.toISOString().slice(0,7);
      const [y,m] = month.split('-').map(Number);
      const from = new Date(y, m-1, 1), to = new Date(y, m, 1);
      const [expenses, payroll, plans] = await Promise.all([
        prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: from, lt: to } } }),
        prisma.payroll.aggregate({ _sum: { netPay: true }, where: { month } }),
        prisma.budgetPlan.aggregate({ _sum: { budgeted: true }, where: { month } }),
      ]);
      result.push({ month, actual: (expenses._sum.amount||0)+(payroll._sum.netPay||0), budgeted: plans._sum.budgeted||0 });
    }
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
