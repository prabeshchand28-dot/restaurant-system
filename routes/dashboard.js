// routes/dashboard.js
const express  = require('express');
const router   = express.Router();
const prisma   = require('../config/prisma');
const notify   = require('../services/notificationService');

// SSE — real-time notifications
router.get('/events', (req, res) => {
  const clientId = Date.now().toString();
  notify.addClient(clientId, res);
});

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const now       = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now - 7  * 86400000);
    const monthStart = new Date(now - 30 * 86400000);

    // Parallel queries
    const [
      orders, payments, guests, ratings, inventory, reservations, recentOrders,
    ] = await Promise.all([
      prisma.order.findMany({ include: { items: true } }),
      prisma.payment.findMany(),
      prisma.guest.findMany(),
      prisma.rating.findMany(),
      prisma.inventoryItem.findMany(),
      prisma.reservation.findMany({
        where: { date: todayStart.toISOString().split('T')[0] },
      }),
      prisma.order.findMany({
        include:  { items: true },
        orderBy:  { createdAt: 'desc' },
        take:     10,
      }),
    ]);

    // Revenue helpers
    const revenueInRange = (from) =>
      payments.filter(p => new Date(p.createdAt) >= from).reduce((s, p) => s + p.amount, 0);

    // Hourly revenue (last 12 hours)
    const hourlyRevenue = {};
    for (let h = 0; h < 12; h++) {
      const hr = new Date(now);
      hr.setHours(hr.getHours() - h, 0, 0, 0);
      const label = `${hr.getHours()}:00`;
      hourlyRevenue[label] = payments
        .filter(p => {
          const ph = new Date(p.createdAt);
          return ph.getHours() === hr.getHours() && ph.toDateString() === hr.toDateString();
        })
        .reduce((s, p) => s + p.amount, 0);
    }

    // Top items
    const itemCount = {};
    orders.forEach(o => o.items.forEach(i => {
      itemCount[i.name] = (itemCount[i.name] || 0) + i.qty;
    }));
    const topItems = Object.entries(itemCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, qty]) => ({ name, qty }));

    // Peak hours
    const peakHours = {};
    orders.forEach(o => {
      const h = new Date(o.createdAt).getHours() + ':00';
      peakHours[h] = (peakHours[h] || 0) + 1;
    });

    const avgRating = ratings.length
      ? (ratings.reduce((s, r) => s + r.overall, 0) / ratings.length).toFixed(1)
      : '—';

    const lowStock = inventory.filter(i => i.quantity <= i.minStock).length;

    const stats = {
      totalOrders:      orders.length,
      pendingOrders:    orders.filter(o => o.status === 'Pending').length,
      preparingOrders:  orders.filter(o => o.status === 'Preparing').length,
      completedOrders:  orders.filter(o => o.status === 'Completed').length,
      revenue:          payments.reduce((s, p) => s + p.amount, 0),
      todayRevenue:     revenueInRange(todayStart),
      weekRevenue:      revenueInRange(weekStart),
      monthRevenue:     revenueInRange(monthStart),
      totalGuests:      guests.reduce((s, g) => s + g.count, 0),
      avgRating,
      totalRatings:     ratings.length,
      lowStock,
      topItems,
      hourlyRevenue,
      peakHours,
      todayOrders:      orders.filter(o => new Date(o.createdAt) >= todayStart).length,
      totalReservations: reservations.length,
    };

    // Shape recent orders same as orders route
    const shapedOrders = recentOrders.map(o => ({
      id:    o.id,
      table: o.tableNumber,
      status: o.status,
      time:  o.createdAt,
      items: o.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
    }));

    res.json({ stats, orders: shapedOrders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
