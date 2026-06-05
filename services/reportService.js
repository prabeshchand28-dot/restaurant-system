// services/reportService.js
const prisma = require('../config/prisma');

async function getDailySummary() {
  const [orders, payments, guests, ratings] = await Promise.all([
    prisma.order.findMany({ include: { items: true } }),
    prisma.payment.findMany(),
    prisma.guest.findMany(),
    prisma.rating.findMany(),
  ]);

  // Top items
  const itemCount = {};
  orders.forEach(o => o.items.forEach(i => {
    itemCount[i.name] = (itemCount[i.name] || 0) + i.qty;
  }));
  const topItems = Object.entries(itemCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  // Orders by status
  const byStatus = {
    Pending:   orders.filter(o => o.status === 'Pending').length,
    Preparing: orders.filter(o => o.status === 'Preparing').length,
    Completed: orders.filter(o => o.status === 'Completed').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  };

  // Guest breakdown
  const guestBreakdown = guests.reduce((acc, g) => {
    acc[g.gender] = (acc[g.gender] || 0) + g.count;
    return acc;
  }, {});

  // Payment breakdown
  const paymentBreakdown = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {});

  // Hourly orders
  const hourly = {};
  orders.forEach(o => {
    const hr = new Date(o.createdAt).getHours();
    hourly[hr] = (hourly[hr] || 0) + 1;
  });

  // Stats
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(now - 7  * 86400000);
  const monthStart = new Date(now - 30 * 86400000);

  const revenueInRange = (from) =>
    payments.filter(p => new Date(p.createdAt) >= from).reduce((s, p) => s + p.amount, 0);

  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.overall, 0) / ratings.length).toFixed(1)
    : '—';

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
  };

  return { stats, topItems, byStatus, guestBreakdown, paymentBreakdown, hourly };
}

module.exports = { getDailySummary };
