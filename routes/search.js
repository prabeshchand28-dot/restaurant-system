// routes/search.js — Global Search API
// GET /api/search?q=term&limit=5
// Searches 20+ models in parallel and returns grouped results.

const express =require('express');
const router  = express.Router();
const prisma  = require('../config/prisma');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const q     = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit) || 5, 20);

  if (!q || q.length < 1) return res.json({ results: [], total: 0 });

  const contains = { contains: q, mode: 'insensitive' };

  // ── Run all searches in parallel ──────────────────────────
  const [
    menuItems,
    orders,
    guests,
    staffList,
    inventory,
    suppliers,
    reservations,
    tables,
    recipes,
    coupons,
    expenses,
    payments,
    giftCards,
    campaigns,
    promotions,
    feedback,
    waitlist,
    purchaseOrders,
    invoices,
    training,
  ] = await Promise.allSettled([

    // Menu items
    prisma.menuItem.findMany({
      where: { OR: [{ name: contains }, { description: contains }, { category: contains }] },
      select: { id: true, name: true, category: true, price: true, available: true },
      take: limit,
    }),

    // Orders
    prisma.order.findMany({
      where: { OR: [{ status: contains }, { guestName: contains }, { tableNumber: contains }] },
      select: { id: true, guestName: true, tableNumber: true, status: true, total: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),

    // Guests / Customers
    prisma.customerProfile.findMany({
      where: { OR: [{ name: contains }, { phone: contains }, { email: contains }] },
      select: { id: true, name: true, phone: true, email: true, totalVisits: true },
      take: limit,
    }),

    // Staff
    prisma.user.findMany({
      where: { OR: [{ name: contains }, { username: contains }, { role: contains }] },
      select: { id: true, name: true, username: true, role: true },
      take: limit,
    }),

    // Inventory
    prisma.inventoryItem.findMany({
      where: { OR: [{ name: contains }, { category: contains }, { unit: contains }] },
      select: { id: true, name: true, category: true, quantity: true, unit: true, reorderLevel: true },
      take: limit,
    }),

    // Suppliers
    prisma.supplier.findMany({
      where: { OR: [{ name: contains }, { contact: contains }, { email: contains }] },
      select: { id: true, name: true, contact: true, email: true },
      take: limit,
    }),

    // Reservations
    prisma.reservation.findMany({
      where: { OR: [{ guestName: contains }, { phone: contains }, { status: contains }] },
      select: { id: true, guestName: true, phone: true, date: true, time: true, status: true, partySize: true },
      take: limit,
      orderBy: { date: 'desc' },
    }),

    // Tables
    prisma.restaurantTable.findMany({
      where: { OR: [{ tableNumber: contains }, { status: contains }, { section: contains }] },
      select: { id: true, tableNumber: true, status: true, capacity: true, section: true },
      take: limit,
    }),

    // Recipes
    prisma.recipe.findMany({
      where: { OR: [{ name: contains }, { category: contains }] },
      select: { id: true, name: true, category: true, costPerServing: true },
      take: limit,
    }),

    // Coupons
    prisma.coupon.findMany({
      where: { OR: [{ code: contains }, { description: contains }] },
      select: { id: true, code: true, description: true, discount: true, discountType: true, active: true },
      take: limit,
    }),

    // Expenses
    prisma.expense.findMany({
      where: { OR: [{ description: contains }, { category: contains }] },
      select: { id: true, description: true, category: true, amount: true, date: true },
      take: limit,
      orderBy: { date: 'desc' },
    }),

    // Payments
    prisma.payment.findMany({
      where: { OR: [{ method: contains }, { reference: contains }, { status: contains }] },
      select: { id: true, method: true, amount: true, status: true, reference: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),

    // Gift Cards
    prisma.giftCard.findMany({
      where: { OR: [{ code: contains }, { status: contains }] },
      select: { id: true, code: true, balance: true, status: true },
      take: limit,
    }),

    // Campaigns
    prisma.marketingCampaign.findMany({
      where: { OR: [{ name: contains }, { type: contains }, { status: contains }] },
      select: { id: true, name: true, type: true, status: true },
      take: limit,
    }),

    // Promotions
    prisma.promotion.findMany({
      where: { OR: [{ name: contains }, { description: contains }] },
      select: { id: true, name: true, description: true, discountType: true, active: true },
      take: limit,
    }),

    // Feedback
    prisma.feedbackEntry.findMany({
      where: { OR: [{ guestName: contains }, { comment: contains }] },
      select: { id: true, guestName: true, comment: true, rating: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),

    // Waitlist
    prisma.waitlistEntry.findMany({
      where: { OR: [{ guestName: contains }, { phone: contains }, { status: contains }] },
      select: { id: true, guestName: true, phone: true, partySize: true, status: true },
      take: limit,
    }),

    // Purchase Orders
    prisma.purchaseOrder.findMany({
      where: { OR: [{ status: contains }, { notes: contains }] },
      select: { id: true, status: true, totalAmount: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),

    // Vendor Invoices
    prisma.vendorInvoice.findMany({
      where: { OR: [{ vendorName: contains }, { status: contains }, { invoiceNumber: contains }] },
      select: { id: true, vendorName: true, invoiceNumber: true, amount: true, status: true },
      take: limit,
    }),

    // Training Modules
    prisma.trainingModule.findMany({
      where: { OR: [{ title: contains }, { category: contains }] },
      select: { id: true, title: true, category: true },
      take: limit,
    }),
  ]);

  // ── Helper: unwrap allSettled ──────────────────────────
  const ok = r => (r.status === 'fulfilled' ? r.value : []);

  // ── Build grouped results ──────────────────────────────
  const groups = [];

  const add = (type, emoji, label, items, mapper) => {
    const mapped = items.map(mapper).filter(Boolean);
    if (mapped.length) groups.push({ type, emoji, label, items: mapped });
  };

  add('menu', '🍽️', 'Menu Items', ok(menuItems), i => ({
    id: i.id, title: i.name,
    subtitle: `${i.category || 'Menu'} · $${Number(i.price).toFixed(2)}${i.available ? '' : ' · unavailable'}`,
    action: "showSection('menu',null)",
    badge: i.available ? null : { text: '86\'d', color: '#ef4444' },
  }));

  add('order', '🧾', 'Orders', ok(orders), i => ({
    id: i.id, title: `Order #${i.id}`,
    subtitle: `${i.guestName || 'Walk-in'} · Table ${i.tableNumber || '-'} · $${Number(i.total || 0).toFixed(2)} · ${i.status}`,
    action: "showSection('orders',null)",
    badge: statusBadge(i.status),
  }));

  add('customer', '👤', 'Customers', ok(guests), i => ({
    id: i.id, title: i.name,
    subtitle: `${i.phone || i.email || 'No contact'} · ${i.totalVisits || 0} visits`,
    action: "showSection('crm',null)",
  }));

  add('staff', '👥', 'Staff', ok(staffList), i => ({
    id: i.id, title: i.name || i.username,
    subtitle: (i.role || 'staff').toUpperCase(),
    action: "showSection('staff',null)",
  }));

  add('inventory', '📦', 'Inventory', ok(inventory), i => ({
    id: i.id, title: i.name,
    subtitle: `${i.category || '-'} · ${i.quantity} ${i.unit}${i.quantity <= (i.reorderLevel || 0) ? ' · LOW STOCK' : ''}`,
    action: "showSection('inventory',null)",
    badge: i.quantity <= (i.reorderLevel || 0) ? { text: 'Low', color: '#f97316' } : null,
  }));

  add('supplier', '🏭', 'Suppliers', ok(suppliers), i => ({
    id: i.id, title: i.name,
    subtitle: i.contact || i.email || 'No contact',
    action: "location.href='/suppliers'",
  }));

  add('reservation', '📅', 'Reservations', ok(reservations), i => ({
    id: i.id, title: i.guestName,
    subtitle: `${i.date ? new Date(i.date).toLocaleDateString() : '-'} ${i.time || ''} · Party of ${i.partySize} · ${i.status}`,
    action: "showSection('reservations',null)",
    badge: statusBadge(i.status),
  }));

  add('table', '🪑', 'Tables', ok(tables), i => ({
    id: i.id, title: `Table ${i.tableNumber}`,
    subtitle: `${i.section || 'Main'} · Capacity ${i.capacity} · ${i.status}`,
    action: "showSection('tables',null)",
    badge: statusBadge(i.status),
  }));

  add('recipe', '📖', 'Recipes', ok(recipes), i => ({
    id: i.id, title: i.name,
    subtitle: `${i.category || 'Recipe'}${i.costPerServing ? ` · $${Number(i.costPerServing).toFixed(2)}/serving` : ''}`,
    action: "location.href='/recipes'",
  }));

  add('coupon', '🎟️', 'Coupons', ok(coupons), i => ({
    id: i.id, title: i.code,
    subtitle: `${i.discountType === 'percent' ? i.discount + '%' : '$' + i.discount} off · ${i.description || ''}`,
    action: "location.href='/coupons'",
    badge: i.active ? null : { text: 'Inactive', color: '#6b7280' },
  }));

  add('expense', '💸', 'Expenses', ok(expenses), i => ({
    id: i.id, title: i.description,
    subtitle: `${i.category || '-'} · $${Number(i.amount).toFixed(2)} · ${i.date ? new Date(i.date).toLocaleDateString() : ''}`,
    action: "location.href='/expenses'",
  }));

  add('payment', '💳', 'Payments', ok(payments), i => ({
    id: i.id, title: `Payment #${i.id}`,
    subtitle: `${i.method} · $${Number(i.amount).toFixed(2)} · ${i.status}${i.reference ? ' · ' + i.reference : ''}`,
    action: "showSection('payments',null)",
    badge: statusBadge(i.status),
  }));

  add('giftcard', '🎁', 'Gift Cards', ok(giftCards), i => ({
    id: i.id, title: i.code,
    subtitle: `Balance: $${Number(i.balance).toFixed(2)} · ${i.status}`,
    action: "location.href='/gift-cards'",
  }));

  add('campaign', '📢', 'Campaigns', ok(campaigns), i => ({
    id: i.id, title: i.name,
    subtitle: `${i.type || 'Campaign'} · ${i.status}`,
    action: "location.href='/campaigns'",
  }));

  add('promotion', '🎯', 'Promotions', ok(promotions), i => ({
    id: i.id, title: i.name,
    subtitle: i.description || (i.active ? 'Active' : 'Inactive'),
    action: "location.href='/promotions'",
    badge: i.active ? null : { text: 'Off', color: '#6b7280' },
  }));

  add('feedback', '💬', 'Feedback', ok(feedback), i => ({
    id: i.id, title: i.guestName || 'Anonymous',
    subtitle: `${i.rating ? '⭐'.repeat(Math.min(i.rating, 5)) : ''} ${(i.comment || '').slice(0, 60)}`,
    action: "location.href='/feedback'",
  }));

  add('waitlist', '⏳', 'Waitlist', ok(waitlist), i => ({
    id: i.id, title: i.guestName,
    subtitle: `${i.phone || '-'} · Party of ${i.partySize} · ${i.status}`,
    action: "location.href='/waitlist'",
  }));

  add('po', '📋', 'Purchase Orders', ok(purchaseOrders), i => ({
    id: i.id, title: `PO #${i.id}`,
    subtitle: `$${Number(i.totalAmount || 0).toFixed(2)} · ${i.status}`,
    action: "location.href='/purchase-orders'",
    badge: statusBadge(i.status),
  }));

  add('invoice', '🧾', 'Invoices', ok(invoices), i => ({
    id: i.id, title: i.vendorName,
    subtitle: `#${i.invoiceNumber || i.id} · $${Number(i.amount || 0).toFixed(2)} · ${i.status}`,
    action: "location.href='/invoices'",
  }));

  add('training', '🎓', 'Training', ok(training), i => ({
    id: i.id, title: i.title,
    subtitle: i.category || 'Training Module',
    action: "location.href='/training'",
  }));

  const total = groups.reduce((s, g) => s + g.items.length, 0);
  res.json({ results: groups, total, query: q });
});

function statusBadge(status) {
  if (!status) return null;
  const map = {
    pending:   '#f97316', active:    '#22c55e', completed: '#22c55e',
    cancelled: '#ef4444', inactive:  '#6b7280', occupied:  '#f97316',
    available: '#22c55e', paid:      '#22c55e', unpaid:    '#ef4444',
    overdue:   '#ef4444', confirmed: '#22c55e', seated:    '#3b82f6',
  };
  const color = map[status.toLowerCase()] || '#6b7280';
  return { text: status, color };
}

module.exports = router;
