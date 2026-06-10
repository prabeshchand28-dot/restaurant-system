const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.floorPlan.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(plans);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getPlan = async (req, res) => {
  try {
    const plan = await prisma.floorPlan.findUnique({ where: { id: Number(req.params.id) } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ ...plan, layout: JSON.parse(plan.layout || '[]') });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createPlan = async (req, res) => {
  try {
    const { name, layout } = req.body;
    const plan = await prisma.floorPlan.create({
      data: {
        name: name || 'Main Floor',
        layout: JSON.stringify(layout || []),
      },
    });
    res.status(201).json(plan);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.savePlan = async (req, res) => {
  try {
    const { name, layout, active } = req.body;
    const data = { updatedAt: new Date() };
    if (name !== undefined) data.name = name;
    if (layout !== undefined) data.layout = JSON.stringify(layout);
    if (active !== undefined) data.active = active;
    const plan = await prisma.floorPlan.update({ where: { id: Number(req.params.id) }, data });
    res.json(plan);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deletePlan = async (req, res) => {
  try {
    await prisma.floorPlan.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
