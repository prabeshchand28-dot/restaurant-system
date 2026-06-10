const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMeals = async (req, res) => {
  try {
    const { staffId, date, shift } = req.query;
    const where = {};
    if (staffId) where.staffId = Number(staffId);
    if (shift) where.shift = shift;
    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const e = new Date(date); e.setHours(23,59,59,999);
      where.date = { gte: d, lte: e };
    } else {
      // Default to today
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(); tomorrow.setHours(23,59,59,999);
      where.date = { gte: today, lte: tomorrow };
    }
    const meals = await prisma.staffMeal.findMany({ where, orderBy: { date: 'desc' } });
    res.json(meals);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.logMeal = async (req, res) => {
  try {
    const { staffId, staffName, shift, mealType, items, value, approvedBy, notes } = req.body;
    if (!staffId) return res.status(400).json({ message: 'staffId required' });
    const meal = await prisma.staffMeal.create({
      data: {
        staffId: Number(staffId),
        staffName: staffName || '',
        shift: shift || 'MORNING',
        mealType: mealType || 'DUTY_MEAL',
        items: items || '',
        value: value ? parseFloat(value) : 0,
        approvedBy: approvedBy || '',
        notes: notes || '',
      },
    });
    res.status(201).json(meal);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteMeal = async (req, res) => {
  try {
    await prisma.staffMeal.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(); tomorrow.setHours(23,59,59,999);
    const [countToday, aggToday, aggMonth] = await Promise.all([
      prisma.staffMeal.count({ where: { date: { gte: today, lte: tomorrow } } }),
      prisma.staffMeal.aggregate({ _sum: { value: true }, where: { date: { gte: today, lte: tomorrow } } }),
      prisma.staffMeal.aggregate({ _sum: { value: true }, where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    ]);
    res.json({ countToday, costToday: aggToday._sum.value || 0, costMonth: aggMonth._sum.value || 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.report = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from) where.date = { gte: new Date(from) };
    if (to) { where.date = { ...where.date, lte: new Date(to + 'T23:59:59') }; }
    const meals = await prisma.staffMeal.findMany({ where, orderBy: { date: 'desc' } });
    // Group by staff
    const byStaff = {};
    meals.forEach(m => {
      if (!byStaff[m.staffName]) byStaff[m.staffName] = { count: 0, total: 0 };
      byStaff[m.staffName].count++;
      byStaff[m.staffName].total += m.value;
    });
    res.json({ meals, byStaff });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
