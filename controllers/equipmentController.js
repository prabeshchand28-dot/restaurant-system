const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { serialNo: { contains: search } },
    ];
    const assets = await prisma.equipmentAsset.findMany({ where, orderBy: { name: 'asc' } });
    res.json(assets);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      name, category = 'KITCHEN', brand = '', model = '', serialNo = '', location = '',
      purchaseDate, purchasePrice = 0, warrantyExpiry, lastMaintenanceAt, nextMaintenanceAt,
      status = 'OPERATIONAL', notes = '',
    } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const asset = await prisma.equipmentAsset.create({
      data: {
        name, category, brand, model, serialNo, location, notes,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: parseFloat(purchasePrice),
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        lastMaintenanceAt: lastMaintenanceAt ? new Date(lastMaintenanceAt) : null,
        nextMaintenanceAt: nextMaintenanceAt ? new Date(nextMaintenanceAt) : null,
        status,
      },
    });
    res.json(asset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    ['purchaseDate', 'warrantyExpiry', 'lastMaintenanceAt', 'nextMaintenanceAt'].forEach(f => {
      if (data[f]) data[f] = new Date(data[f]);
    });
    if (data.purchasePrice !== undefined) data.purchasePrice = parseFloat(data.purchasePrice);
    const asset = await prisma.equipmentAsset.update({ where: { id: parseInt(req.params.id) }, data });
    res.json(asset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.equipmentAsset.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
    const [total, operational, maintenance, faulty, dueSoon] = await Promise.all([
      prisma.equipmentAsset.count(),
      prisma.equipmentAsset.count({ where: { status: 'OPERATIONAL' } }),
      prisma.equipmentAsset.count({ where: { status: 'MAINTENANCE' } }),
      prisma.equipmentAsset.count({ where: { status: 'FAULTY' } }),
      prisma.equipmentAsset.count({ where: { nextMaintenanceAt: { gte: now, lte: thirtyDays } } }),
    ]);
    res.json({ total, operational, maintenance, faulty, dueSoon });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
