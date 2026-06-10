const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: { _count: { select: { subscriptions: { where: { status: 'ACTIVE' } } } } },
      orderBy: { price: 'asc' },
    });
    res.json(plans);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { name, description = '', duration = 'MONTHLY', mealsPerDay = 1, daysPerWeek = 5, price, includes = '' } = req.body;
    if (!name || !price) return res.status(400).json({ message: 'name and price required' });
    const plan = await prisma.subscriptionPlan.create({
      data: { name, description, duration, mealsPerDay: parseInt(mealsPerDay), daysPerWeek: parseInt(daysPerWeek), price: parseFloat(price), includes },
    });
    res.json(plan);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.price) data.price = parseFloat(data.price);
    if (data.mealsPerDay) data.mealsPerDay = parseInt(data.mealsPerDay);
    if (data.daysPerWeek) data.daysPerWeek = parseInt(data.daysPerWeek);
    const plan = await prisma.subscriptionPlan.update({ where: { id: parseInt(req.params.id) }, data });
    res.json(plan);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    await prisma.subscriptionPlan.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Customer Subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const { status, planId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (planId) where.planId = parseInt(planId);
    // Auto-expire
    await prisma.customerSubscription.updateMany({
      where: { status: 'ACTIVE', endDate: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
    const subs = await prisma.customerSubscription.findMany({
      where, include: { plan: true }, orderBy: { createdAt: 'desc' },
    });
    res.json(subs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.subscribe = async (req, res) => {
  try {
    const { planId, customerName, customerPhone = '', startDate, amountPaid = 0, notes = '', customerId } = req.body;
    if (!planId || !customerName || !startDate) return res.status(400).json({ message: 'planId, customerName, startDate required' });
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: parseInt(planId) } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    const start = new Date(startDate);
    const end = new Date(start);
    if (plan.duration === 'WEEKLY') end.setDate(end.getDate() + 7);
    else if (plan.duration === 'MONTHLY') end.setMonth(end.getMonth() + 1);
    else if (plan.duration === 'QUARTERLY') end.setMonth(end.getMonth() + 3);
    const sub = await prisma.customerSubscription.create({
      data: {
        planId: parseInt(planId), customerName, customerPhone, startDate: start, endDate: end,
        amountPaid: parseFloat(amountPaid), notes,
        customerId: customerId ? parseInt(customerId) : null,
      },
      include: { plan: true },
    });
    res.json(sub);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.amountPaid) data.amountPaid = parseFloat(data.amountPaid);
    const sub = await prisma.customerSubscription.update({ where: { id: parseInt(req.params.id) }, data });
    res.json(sub);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.stats = async (req, res) => {
  try {
    await prisma.customerSubscription.updateMany({
      where: { status: 'ACTIVE', endDate: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
    const [active, paused, expired, revenue] = await Promise.all([
      prisma.customerSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.customerSubscription.count({ where: { status: 'PAUSED' } }),
      prisma.customerSubscription.count({ where: { status: 'EXPIRED' } }),
      prisma.customerSubscription.aggregate({ _sum: { amountPaid: true } }),
    ]);
    res.json({ active, paused, expired, totalRevenue: revenue._sum.amountPaid || 0 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
