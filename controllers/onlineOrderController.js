const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Public API (no auth) ────────────────────────────────
exports.getPublicMenu = async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { available: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    // Group by category
    const grouped = items.reduce((acc, item) => {
      const cat = item.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    res.json({ categories: Object.keys(grouped), items: grouped });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.placeOrder = async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, orderType, address, items, notes, paymentMethod } = req.body;
    if (!customerName || !customerPhone || !items?.length) {
      return res.status(400).json({ message: 'Name, phone, and items are required' });
    }

    // Calculate totals
    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const deliveryFee = orderType === 'DELIVERY' ? 100 : 0; // flat fee, can be zone-based
    const taxRate = 0.13; // 13% VAT
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + deliveryFee + tax;

    const order = await prisma.onlineOrder.create({
      data: {
        customerName, customerPhone, customerEmail: customerEmail || '',
        orderType: orderType || 'DELIVERY',
        address: address || '',
        subtotal, deliveryFee, tax, total,
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || '',
        items: {
          create: items.map(i => ({
            name: i.name, price: i.price, quantity: i.quantity,
            menuItemId: i.menuItemId || null, notes: i.notes || ''
          }))
        }
      },
      include: { items: true }
    });
    res.json({ success: true, order, message: `Order #${order.id} placed! Estimated ${order.estimatedMins} minutes.` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.trackOrder = async (req, res) => {
  try {
    const order = await prisma.onlineOrder.findFirst({
      where: { id: +req.params.id, customerPhone: req.query.phone },
      include: { items: true }
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Admin API ───────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { status, date, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(date); next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }
    const orders = await prisma.onlineOrder.findMany({
      where, include: { items: true }, orderBy: { createdAt: 'desc' }, take: +limit
    });
    res.json(orders);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, estimatedMins } = req.body;
    const data = { status, updatedAt: new Date() };
    if (estimatedMins) data.estimatedMins = +estimatedMins;
    const order = await prisma.onlineOrder.update({
      where: { id: +req.params.id }, data, include: { items: true }
    });
    res.json(order);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [total, pending, confirmed, todayOrders] = await Promise.all([
      prisma.onlineOrder.count(),
      prisma.onlineOrder.count({ where: { status: 'PENDING' } }),
      prisma.onlineOrder.count({ where: { status: { in: ['CONFIRMED', 'PREPARING'] } } }),
      prisma.onlineOrder.findMany({ where: { createdAt: { gte: today } }, select: { total: true } }),
    ]);
    const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    res.json({ total, pending, confirmed, todayCount: todayOrders.length, todayRevenue });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
