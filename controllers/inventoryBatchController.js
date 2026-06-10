const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBatches = async (req, res) => {
  try {
    const { status, search, expiring } = req.query;
    const where = {};
    if (status) where.status = status;
    else where.status = { not: 'DISCARDED' };
    if (search) where.itemName = { contains: search, mode: 'insensitive' };
    if (expiring) {
      const days = Number(expiring) || 7;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + days);
      where.expiryDate = { lte: cutoff, gte: new Date() };
      delete where.status; // override
    }
    const batches = await prisma.inventoryBatch.findMany({ where, orderBy: { expiryDate: 'asc' }, take: 200 });
    res.json(batches);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createBatch = async (req, res) => {
  try {
    const { itemName, batchNumber, supplier, quantity, unit, costPerUnit, expiryDate, notes } = req.body;
    if (!itemName || !quantity) return res.status(400).json({ message: 'Item name and quantity required' });
    const batch = await prisma.inventoryBatch.create({
      data: {
        itemName,
        batchNumber: batchNumber || '',
        supplier: supplier || '',
        quantity: parseFloat(quantity),
        remaining: parseFloat(quantity),
        unit: unit || 'kg',
        costPerUnit: costPerUnit ? parseFloat(costPerUnit) : 0,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes || '',
      },
    });
    res.status(201).json(batch);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.consume = async (req, res) => {
  try {
    const { amount } = req.body;
    const batch = await prisma.inventoryBatch.findUnique({ where: { id: Number(req.params.id) } });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    const newRemaining = Math.max(0, batch.remaining - parseFloat(amount));
    const status = newRemaining <= 0 ? 'CONSUMED' : 'ACTIVE';
    const updated = await prisma.inventoryBatch.update({
      where: { id: batch.id },
      data: { remaining: newRemaining, status, updatedAt: new Date() },
    });
    res.json(updated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const batch = await prisma.inventoryBatch.update({
      where: { id: Number(req.params.id) },
      data: { status, notes: notes || undefined, updatedAt: new Date() },
    });
    res.json(batch);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteBatch = async (req, res) => {
  try {
    await prisma.inventoryBatch.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const in7Days = new Date(); in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(); in30Days.setDate(in30Days.getDate() + 30);
    const [active, consumed, expiredCount, expiringSoon, expiringMonth] = await Promise.all([
      prisma.inventoryBatch.count({ where: { status: 'ACTIVE' } }),
      prisma.inventoryBatch.count({ where: { status: 'CONSUMED' } }),
      prisma.inventoryBatch.count({ where: { expiryDate: { lt: now }, status: 'ACTIVE' } }),
      prisma.inventoryBatch.count({ where: { expiryDate: { gte: now, lte: in7Days }, status: 'ACTIVE' } }),
      prisma.inventoryBatch.count({ where: { expiryDate: { gte: now, lte: in30Days }, status: 'ACTIVE' } }),
    ]);
    // Auto-expire stale batches
    await prisma.inventoryBatch.updateMany({ where: { expiryDate: { lt: now }, status: 'ACTIVE' }, data: { status: 'EXPIRED' } });
    res.json({ active, consumed, expired: expiredCount, expiringSoon, expiringMonth });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
