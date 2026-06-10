const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Delivery Zones ──────────────────────────────────────
exports.getZones = async (req, res) => {
  try {
    const zones = await prisma.deliveryZone.findMany({ orderBy: { minDistance: 'asc' } });
    res.json(zones);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createZone = async (req, res) => {
  try {
    const { name, minDistance, maxDistance, deliveryFee, estimatedMins } = req.body;
    if (!name || !maxDistance) return res.status(400).json({ message: 'name and maxDistance required' });
    const zone = await prisma.deliveryZone.create({
      data: { name, minDistance: +minDistance || 0, maxDistance: +maxDistance, deliveryFee: +deliveryFee || 0, estimatedMins: +estimatedMins || 30 }
    });
    res.json(zone);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateZone = async (req, res) => {
  try {
    const zone = await prisma.deliveryZone.update({ where: { id: +req.params.id }, data: req.body });
    res.json(zone);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.toggleZone = async (req, res) => {
  try {
    const zone = await prisma.deliveryZone.findUnique({ where: { id: +req.params.id } });
    const updated = await prisma.deliveryZone.update({ where: { id: +req.params.id }, data: { active: !zone.active } });
    res.json(updated);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.deleteZone = async (req, res) => {
  try {
    await prisma.deliveryZone.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Delivery Orders ─────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const { status, date } = req.query;
    const where = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(date); next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }
    const orders = await prisma.deliveryOrder.findMany({
      where, include: { zone: true }, orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createOrder = async (req, res) => {
  try {
    const { customerName, customerPhone, address, zoneId, driverName, driverPhone, notes, orderId } = req.body;
    if (!customerName || !customerPhone || !address) return res.status(400).json({ message: 'Name, phone, address required' });
    let deliveryFee = 0, estimatedMins = 30;
    if (zoneId) {
      const zone = await prisma.deliveryZone.findUnique({ where: { id: +zoneId } });
      if (zone) { deliveryFee = zone.deliveryFee; estimatedMins = zone.estimatedMins; }
    }
    const order = await prisma.deliveryOrder.create({
      data: { customerName, customerPhone, address, zoneId: zoneId ? +zoneId : null, driverName: driverName || '', driverPhone: driverPhone || '', notes: notes || '', orderId: orderId ? +orderId : null, deliveryFee, estimatedMins },
      include: { zone: true }
    });
    res.json(order);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, driverName, driverPhone } = req.body;
    const data = { status };
    if (driverName) data.driverName = driverName;
    if (driverPhone) data.driverPhone = driverPhone;
    if (status === 'DELIVERED') data.deliveredAt = new Date();
    const order = await prisma.deliveryOrder.update({ where: { id: +req.params.id }, data, include: { zone: true } });
    res.json(order);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [total, pending, inTransit, delivered] = await Promise.all([
      prisma.deliveryOrder.count(),
      prisma.deliveryOrder.count({ where: { status: 'PENDING' } }),
      prisma.deliveryOrder.count({ where: { status: { in: ['ASSIGNED', 'PICKED'] } } }),
      prisma.deliveryOrder.count({ where: { status: 'DELIVERED' } }),
    ]);
    const revenue = await prisma.deliveryOrder.aggregate({ _sum: { deliveryFee: true }, where: { status: 'DELIVERED' } });
    res.json({ total, pending, inTransit, delivered, totalFees: revenue._sum.deliveryFee || 0 });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
