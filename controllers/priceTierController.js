const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getTiers = async (req, res) => {
  try {
    const tiers = await prisma.priceTier.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(tiers);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createTier = async (req, res) => {
  try {
    const { name, description, multiplier } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const m = multiplier !== undefined ? parseFloat(multiplier) : 1.0;
    if (isNaN(m) || m <= 0) return res.status(400).json({ message: 'Invalid multiplier' });
    const tier = await prisma.priceTier.create({ data: { name, description: description || '', multiplier: m } });
    res.status(201).json(tier);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ message: 'Tier name already exists' });
    res.status(500).json({ message: e.message });
  }
};

exports.updateTier = async (req, res) => {
  try {
    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.multiplier !== undefined) data.multiplier = parseFloat(req.body.multiplier);
    if (req.body.active !== undefined) data.active = req.body.active;
    const tier = await prisma.priceTier.update({ where: { id: Number(req.params.id) }, data });
    res.json(tier);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteTier = async (req, res) => {
  try {
    await prisma.priceTier.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Preview: apply all tiers to a given base price
exports.preview = async (req, res) => {
  try {
    const { basePrice } = req.query;
    if (!basePrice) return res.status(400).json({ message: 'basePrice required' });
    const tiers = await prisma.priceTier.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } });
    const result = tiers.map(t => ({
      ...t,
      adjustedPrice: Math.round(parseFloat(basePrice) * t.multiplier * 100) / 100,
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
