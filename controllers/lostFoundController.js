const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const { status, category } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    const items = await prisma.lostFound.findMany({ where, orderBy: { foundAt: 'desc' } });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { itemName, description = '', foundBy = '', location = '', category = 'OTHER', notes = '' } = req.body;
    if (!itemName) return res.status(400).json({ message: 'itemName required' });
    const item = await prisma.lostFound.create({
      data: { itemName, description, foundBy, location, category, notes },
    });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.claim = async (req, res) => {
  try {
    const { claimedBy, claimantPhone = '' } = req.body;
    if (!claimedBy) return res.status(400).json({ message: 'claimedBy required' });
    const item = await prisma.lostFound.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'CLAIMED', claimedBy, claimantPhone, claimedAt: new Date() },
    });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await prisma.lostFound.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.lostFound.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
