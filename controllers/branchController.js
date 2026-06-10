const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
    res.json(branches);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, address, phone, email, manager } = req.body;
    if (!name) return res.status(400).json({ message: 'Branch name required' });
    const branch = await prisma.branch.create({
      data: { name, address: address || '', phone: phone || '', email: email || '', manager: manager || '' }
    });
    res.json(branch);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, address, phone, email, manager } = req.body;
    const branch = await prisma.branch.update({
      where: { id: +req.params.id },
      data: { name, address, phone, email, manager }
    });
    res.json(branch);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.toggle = async (req, res) => {
  try {
    const b = await prisma.branch.findUnique({ where: { id: +req.params.id } });
    const updated = await prisma.branch.update({ where: { id: +req.params.id }, data: { active: !b.active } });
    res.json(updated);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Branch summary: pull revenue/orders scoped to branch (placeholder — real app would have branchId on Order)
exports.getSummary = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({ where: { active: true } });
    // Simulate stats per branch (in production, orders would have branchId)
    const stats = branches.map(b => ({
      ...b,
      ordersToday: Math.floor(Math.random() * 40) + 5,
      revenueToday: Math.floor(Math.random() * 15000) + 2000,
      staffCount: Math.floor(Math.random() * 8) + 2,
    }));
    res.json(stats);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
