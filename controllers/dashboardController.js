// controllers/dashboardController.js
const prisma  = require('../config/prisma');
const notify  = require('../services/notificationService');

exports.getEvents = (req, res) => {
  notify.addClient(Date.now().toString(), res);
};

exports.getSummary = async (req, res) => {
  try {
    const rid = req.restaurantId || 1;
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now - 7  * 86400000);
    const monthStart = new Date(now - 30 * 86400000);

    const [orders, payments, guests, ratings, inventory, reservations, recentOrders] = await Promise.all([
      prisma.order.findMany({ where: { restaurantId: rid }, include: { items: true } }),
      prisma.payment.findMany({ where: { restaurantId: rid } }),
      prisma.guest.findMany(),
      prisma.rating.findMany(),
      prisma.inventoryItem.findMany({ where: { restaurantId: rid } }),
      prisma.reservation.findMany({ where: { date: todayStart.toISOString().split('T')[0] } }),
      prisma.order.findMany({ where: { restaurantId: rid }, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    const revenueInRange = (from) =>
      payments.filter(p => new Date(p.createdAt) >= from).reduce((s, p) => s + p.amount, 0);

    const itemCount = {};
    orders.forEach(o => o.items.forEach(i => { itemCount[i.name] = (itemCount[i.name] || 0) + i.qty; }));
    const topItems = Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, qty]) => ({ name, qty }));

    const peakHours = {};
    orders.forEach(o => { const h = new Date(o.createdAt).getHours() + ':00'; peakHours[h] = (peakHours[h] || 0) + 1; });

    const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.overall, 0) / ratings.length).toFixed(1) : '—';
    const lowStock  = inventory.filter(i => i.quantity <= i.minStock).length;

    const byStatus = {
      Pending:   orders.filter(o => o.status === 'Pending').length,
      Preparing: orders.filter(o => o.status === 'Preparing').length,
      Completed: orders.filter(o => o.status === 'Completed').length,
      Cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };
    const paymentBreakdown = payments.reduce((acc, p) => { acc[p.method] = (acc[p.method] || 0) + p.amount; return acc; }, {});

    const stats = {
      totalOrders:     orders.length,
      pendingOrders:   byStatus.Pending,
      preparingOrders: byStatus.Preparing,
      completedOrders: byStatus.Completed,
      revenue:         payments.reduce((s, p) => s + p.amount, 0),
      todayRevenue:    revenueInRange(todayStart),
      weekRevenue:     revenueInRange(weekStart),
      monthRevenue:    revenueInRange(monthStart),
      totalGuests:     guests.reduce((s, g) => s + g.count, 0),
      avgRating,
      totalRatings:    ratings.length,
      lowStock,
      todayReservations: reservations.length,
      sseClients:      notify.clientCount(),
    };

    res.json({
      stats, topItems, byStatus, paymentBreakdown, peakHours,
      recentOrders: recentOrders.map(o => ({
        id: o.id, table: o.tableNumber, status: o.status, time: o.createdAt,
        items: o.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        total: o.items.reduce((s, i) => s + i.price * i.qty, 0),
      })),
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
