require('dotenv').config();
const express      = require('express');
const path         = require('path');
const cors         = require('cors');
const prisma       = require('./config/prisma');
const logger       = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const {
  authLimiter,
  orderLimiter,
  paymentLimiter,
  generalLimiter,
} = require('./middleware/ratelimiter');

const app      = express();
const PORT     = process.env.PORT || 3000;
const BUILD_ID = Date.now().toString(); // Changes every server restart

// ── Core middleware ─────────────────────────────────────
app.use(cors());
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rate limiters (applied BEFORE routes) ───────────────
app.use('/api/auth',     authLimiter);      // strict  — login/OTP
app.use('/api/orders',   orderLimiter);     // moderate — order placement
app.use('/api/payments', paymentLimiter);   // strict  — payments
app.use('/api',          generalLimiter);   // catch-all for remaining API routes

// ── Health check (Railway) ──────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/menu',         require('./routes/menu'));
app.use('/api/orders',       require('./routes/orders'));
app.use('/api/guests',       require('./routes/guests'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/tables',       require('./routes/tables'));
app.use('/api/reports',      require('./routes/reports'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/ratings',      require('./routes/ratings'));
app.use('/api/staff',        require('./routes/staff'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/inventory',    require('./routes/inventory'));
app.use('/api/kitchen',      require('./routes/kitchen'));
app.use('/api/attendance',   require('./routes/attendance'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/loyalty',      require('./routes/loyalty'));
app.use('/api/coupons',      require('./routes/coupons'));
app.use('/api/crm',          require('./routes/crm'));
app.use('/api/suppliers',    require('./routes/suppliers'));
app.use('/api/shifts',       require('./routes/shifts'));
app.use('/api/expenses',     require('./routes/expenses'));
app.use('/api/audit',        require('./routes/audit'));
app.use('/api/payroll',      require('./routes/payroll'));
app.use('/api/leaves',       require('./routes/leaves'));
app.use('/api/recipes',      require('./routes/recipes'));
app.use('/api/finance',      require('./routes/finance'));
app.use('/api/promotions',   require('./routes/promotions'));
app.use('/api/wallet',        require('./routes/wallet'));
app.use('/api/delivery',      require('./routes/delivery'));
app.use('/api/branches',      require('./routes/branches'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/tax',           require('./routes/tax'));
app.use('/api/stock',         require('./routes/stockHistory'));
app.use('/api/qr',            require('./routes/qr'));
app.use('/api/closing',       require('./routes/closing'));
app.use('/api/online-orders', require('./routes/onlineOrders'));
app.use('/api/performance',   require('./routes/staffPerformance'));
app.use('/api/campaigns',     require('./routes/campaigns'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/payments/gateway', require('./routes/stripe'));
// Phase 5
app.use('/api/waste',            require('./routes/waste'));
app.use('/api/events',           require('./routes/events'));
app.use('/api/roster',           require('./routes/roster'));
app.use('/api/invoices',         require('./routes/invoices'));
app.use('/api/feedback',         require('./routes/feedback'));
app.use('/api/menu-engineering', require('./routes/menuEngineering'));
// Phase 6
app.use('/api/tips',      require('./routes/tips'));
app.use('/api/training',  require('./routes/training'));
app.use('/api/budget',    require('./routes/budget'));
app.use('/api/tasks',     require('./routes/taskManager'));
// Phase 7
app.use('/api/clock',       require('./routes/clock'));
app.use('/api/gift-cards',  require('./routes/giftCards'));
app.use('/api/modifiers',   require('./routes/modifiers'));
app.use('/api/equipment',   require('./routes/equipment'));
app.use('/api/handover',    require('./routes/handover'));
// Phase 8
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/specials',        require('./routes/dailySpecials'));
app.use('/api/advances',        require('./routes/staffAdvances'));
app.use('/api/lost-found',      require('./routes/lostFound'));
app.use('/api/subscriptions',   require('./routes/subscriptions'));
// Phase 9
app.use('/api/allergens',    require('./routes/allergens'));
app.use('/api/waitlist',     require('./routes/waitlist'));
app.use('/api/voids',        require('./routes/voids'));
app.use('/api/price-tiers',  require('./routes/priceTiers'));
app.use('/api/commissions',  require('./routes/commissions'));
// Phase 10
app.use('/api/deposits',          require('./routes/reservationDeposits'));
app.use('/api/disciplinary',      require('./routes/disciplinary'));
app.use('/api/birthdays',         require('./routes/birthdays'));
app.use('/api/inventory-batches', require('./routes/inventoryBatches'));
app.use('/api/table-hygiene',     require('./routes/tableHygiene'));
// Phase 11
app.use('/api/staff-meals',  require('./routes/staffMeals'));
app.use('/api/tip-pool',     require('./routes/tipPool'));
app.use('/api/night-audit',  require('./routes/nightAudit'));
app.use('/api/floor-plan',   require('./routes/floorPlan'));
app.use('/api/menu-86',      require('./routes/menu86'));
// Phase 12
app.use('/api/staff-uniforms',    require('./routes/staffUniforms'));
app.use('/api/guest-blacklist',   require('./routes/guestBlacklist'));
app.use('/api/menu-categories',   require('./routes/menuCategories'));
app.use('/api/prep-checklists',   require('./routes/prepChecklists'));
app.use('/api/staff-recognitions',require('./routes/staffRecognitions'));
app.use('/api/incidents',         require('./routes/incidentLogs'));
app.use('/api/search',            require('./routes/search'));      // Global Search

// ── Health / Auto-update ping ────────────────────────────
// Returns the buildId (set at startup). If it changes, clients auto-reload.
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, buildId: BUILD_ID, time: new Date().toISOString() });
});

// ── Page Routes ─────────────────────────────────────────
app.get('/',          (req, res) => res.redirect('/login'));
app.get('/app',       (req, res) => res.sendFile(path.join(__dirname, 'public/install.html')));
app.get('/install',   (req, res) => res.sendFile(path.join(__dirname, 'public/install.html')));
app.get('/login',        (req, res) => res.sendFile(path.join(__dirname, 'views/login.html')));
app.get('/table',        (req, res) => res.sendFile(path.join(__dirname, 'views/table-info.html')));
// Signup is superadmin-only now — public access disabled
app.get('/signup', (req, res) => res.redirect('/superadmin'));
app.get('/superadmin',   (req, res) => res.sendFile(path.join(__dirname, 'views/superadmin.html')));
app.get('/dashboard',    (req, res) => res.sendFile(path.join(__dirname, 'views/dashboard.html')));
app.get('/order-manage', (req, res) => res.sendFile(path.join(__dirname, 'views/order-manage.html')));
app.get('/kitchen',      (req, res) => res.sendFile(path.join(__dirname, 'views/kitchen.html')));
app.get('/order',     (req, res) => res.sendFile(path.join(__dirname, 'views/order.html')));
app.get('/payment',   (req, res) => res.sendFile(path.join(__dirname, 'views/payment.html')));
app.get('/reports',   (req, res) => res.sendFile(path.join(__dirname, 'views/reports.html')));
app.get('/tables',    (req, res) => res.sendFile(path.join(__dirname, 'views/tables.html')));
app.get('/staff',     (req, res) => res.sendFile(path.join(__dirname, 'views/staff.html')));
app.get('/loyalty',   (req, res) => res.sendFile(path.join(__dirname, 'views/loyalty.html')));
app.get('/crm',       (req, res) => res.sendFile(path.join(__dirname, 'views/crm.html')));
app.get('/suppliers', (req, res) => res.sendFile(path.join(__dirname, 'views/suppliers.html')));
app.get('/shifts',    (req, res) => res.sendFile(path.join(__dirname, 'views/shifts.html')));
app.get('/expenses',  (req, res) => res.sendFile(path.join(__dirname, 'views/expenses.html')));
app.get('/coupons',   (req, res) => res.sendFile(path.join(__dirname, 'views/coupons.html')));
app.get('/audit',       (req, res) => res.sendFile(path.join(__dirname, 'views/audit.html')));
app.get('/payroll',     (req, res) => res.sendFile(path.join(__dirname, 'views/payroll.html')));
app.get('/leaves',      (req, res) => res.sendFile(path.join(__dirname, 'views/leaves.html')));
app.get('/recipes',     (req, res) => res.sendFile(path.join(__dirname, 'views/recipes.html')));
app.get('/finance',     (req, res) => res.sendFile(path.join(__dirname, 'views/finance.html')));
app.get('/promotions',  (req, res) => res.sendFile(path.join(__dirname, 'views/promotions.html')));
app.get('/wallet',        (req, res) => res.sendFile(path.join(__dirname, 'views/wallet.html')));
app.get('/delivery',      (req, res) => res.sendFile(path.join(__dirname, 'views/delivery.html')));
app.get('/branches',      (req, res) => res.sendFile(path.join(__dirname, 'views/branches.html')));
app.get('/notifications', (req, res) => res.sendFile(path.join(__dirname, 'views/notifications.html')));
app.get('/tax',           (req, res) => res.sendFile(path.join(__dirname, 'views/tax.html')));
app.get('/stock-history', (req, res) => res.sendFile(path.join(__dirname, 'views/stock-history.html')));
app.get('/qr-codes',      (req, res) => res.sendFile(path.join(__dirname, 'views/qr-codes.html')));
app.get('/closing',         (req, res) => res.sendFile(path.join(__dirname, 'views/closing.html')));
app.get('/menu',            (req, res) => res.sendFile(path.join(__dirname, 'views/menu-public.html')));
app.get('/online-orders',   (req, res) => res.sendFile(path.join(__dirname, 'views/online-orders.html')));
app.get('/performance',     (req, res) => res.sendFile(path.join(__dirname, 'views/performance.html')));
app.get('/campaigns',       (req, res) => res.sendFile(path.join(__dirname, 'views/campaigns.html')));
app.get('/advanced-analytics',(req,res)=> res.sendFile(path.join(__dirname, 'views/advanced-analytics.html')));
app.get('/payment-settings',(req, res) => res.sendFile(path.join(__dirname, 'views/payment-settings.html')));
app.get('/payment-success', (req, res) => res.sendFile(path.join(__dirname, 'views/payment-success.html')));
// Phase 5 pages
app.get('/waste',            (req, res) => res.sendFile(path.join(__dirname, 'views/waste.html')));
app.get('/events',           (req, res) => res.sendFile(path.join(__dirname, 'views/events.html')));
app.get('/roster',           (req, res) => res.sendFile(path.join(__dirname, 'views/roster.html')));
app.get('/invoices',         (req, res) => res.sendFile(path.join(__dirname, 'views/invoices.html')));
app.get('/feedback-admin',   (req, res) => res.sendFile(path.join(__dirname, 'views/feedback-admin.html')));
app.get('/feedback',         (req, res) => res.sendFile(path.join(__dirname, 'views/feedback-public.html')));
app.get('/menu-engineering', (req, res) => res.sendFile(path.join(__dirname, 'views/menu-engineering.html')));
// Phase 6 pages
app.get('/tips',             (req, res) => res.sendFile(path.join(__dirname, 'views/tips.html')));
app.get('/training',         (req, res) => res.sendFile(path.join(__dirname, 'views/training.html')));
app.get('/budget',           (req, res) => res.sendFile(path.join(__dirname, 'views/budget.html')));
app.get('/task-manager',     (req, res) => res.sendFile(path.join(__dirname, 'views/task-manager.html')));
app.get('/loyalty-portal',   (req, res) => res.sendFile(path.join(__dirname, 'views/loyalty-portal.html')));
app.get('/reservation-calendar', (req, res) => res.sendFile(path.join(__dirname, 'views/reservation-calendar.html')));
// Phase 7 pages
app.get('/clock',            (req, res) => res.sendFile(path.join(__dirname, 'views/clock.html')));
app.get('/gift-cards',       (req, res) => res.sendFile(path.join(__dirname, 'views/gift-cards.html')));
app.get('/modifiers',        (req, res) => res.sendFile(path.join(__dirname, 'views/modifiers.html')));
app.get('/equipment',        (req, res) => res.sendFile(path.join(__dirname, 'views/equipment.html')));
app.get('/handover',         (req, res) => res.sendFile(path.join(__dirname, 'views/handover.html')));
// Phase 8 pages
app.get('/purchase-orders',  (req, res) => res.sendFile(path.join(__dirname, 'views/purchase-orders.html')));
app.get('/daily-specials',   (req, res) => res.sendFile(path.join(__dirname, 'views/daily-specials.html')));
app.get('/staff-advances',   (req, res) => res.sendFile(path.join(__dirname, 'views/staff-advances.html')));
app.get('/lost-found',       (req, res) => res.sendFile(path.join(__dirname, 'views/lost-found.html')));
app.get('/subscriptions',    (req, res) => res.sendFile(path.join(__dirname, 'views/subscriptions.html')));
// Phase 9 pages
app.get('/allergens',    (req, res) => res.sendFile(path.join(__dirname, 'views/allergens.html')));
app.get('/waitlist',     (req, res) => res.sendFile(path.join(__dirname, 'views/waitlist.html')));
app.get('/voids',        (req, res) => res.sendFile(path.join(__dirname, 'views/voids.html')));
app.get('/price-tiers',  (req, res) => res.sendFile(path.join(__dirname, 'views/price-tiers.html')));
app.get('/commissions',  (req, res) => res.sendFile(path.join(__dirname, 'views/commissions.html')));
// Phase 10 pages
app.get('/reservation-deposits', (req, res) => res.sendFile(path.join(__dirname, 'views/reservation-deposits.html')));
app.get('/disciplinary',         (req, res) => res.sendFile(path.join(__dirname, 'views/disciplinary.html')));
app.get('/birthdays',            (req, res) => res.sendFile(path.join(__dirname, 'views/birthdays.html')));
app.get('/inventory-batches',    (req, res) => res.sendFile(path.join(__dirname, 'views/inventory-batches.html')));
app.get('/table-hygiene',        (req, res) => res.sendFile(path.join(__dirname, 'views/table-hygiene.html')));
// Phase 11 pages
app.get('/staff-meals',        (req, res) => res.sendFile(path.join(__dirname, 'views/staff-meals.html')));
app.get('/tip-pool',           (req, res) => res.sendFile(path.join(__dirname, 'views/tip-pool.html')));
app.get('/night-audit',        (req, res) => res.sendFile(path.join(__dirname, 'views/night-audit.html')));
app.get('/floor-plan',         (req, res) => res.sendFile(path.join(__dirname, 'views/floor-plan.html')));
app.get('/menu-86',            (req, res) => res.sendFile(path.join(__dirname, 'views/menu-86.html')));
app.get('/recipe-scaling',     (req, res) => res.sendFile(path.join(__dirname, 'views/recipe-scaling.html')));
app.get('/supplier-compare',   (req, res) => res.sendFile(path.join(__dirname, 'views/supplier-compare.html')));
app.get('/feedback-analytics', (req, res) => res.sendFile(path.join(__dirname, 'views/feedback-analytics.html')));
// Phase 12 pages
app.get('/staff-uniforms',     (req, res) => res.sendFile(path.join(__dirname, 'views/staff-uniforms.html')));
app.get('/guest-blacklist',    (req, res) => res.sendFile(path.join(__dirname, 'views/guest-blacklist.html')));
app.get('/menu-categories',    (req, res) => res.sendFile(path.join(__dirname, 'views/menu-categories.html')));
app.get('/prep-checklists',    (req, res) => res.sendFile(path.join(__dirname, 'views/prep-checklists.html')));
app.get('/staff-recognition',  (req, res) => res.sendFile(path.join(__dirname, 'views/staff-recognition.html')));
app.get('/incident-log',       (req, res) => res.sendFile(path.join(__dirname, 'views/incident-log.html')));
app.get('/cash-counter',       (req, res) => res.sendFile(path.join(__dirname, 'views/cash-counter.html')));
app.get('/shift-snapshot',     (req, res) => res.sendFile(path.join(__dirname, 'views/shift-snapshot.html')));
app.get('/kitchen-timer',      (req, res) => res.sendFile(path.join(__dirname, 'views/kitchen-timer.html')));

// ── Error handler ────────────────────────────────────────
app.use(errorHandler);


// ── Super Admin API ──────────────────────────────────────────────────────────
app.get('/api/superadmin/restaurants', async (req, res) => {
  const key = req.headers['x-super-key'] || req.query.key;
  const SUPER_KEY = 'qrsystem_super2026';
  console.log('[superadmin] key received:', key, '| expected:', SUPER_KEY);
  if (key !== SUPER_KEY) return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const restaurants = await prisma.restaurant.findMany({ orderBy: { createdAt: 'desc' } });
    const [totalUsers, totalOrders] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
    ]);
    const rWithCounts = await Promise.all(restaurants.map(async r => {
      const [uCount, oCount] = await Promise.all([
        prisma.user.count({ where: { restaurantId: r.id } }),
        prisma.order.count({ where: { restaurantId: r.id } }),
      ]);
      return { ...r, _count: { users: uCount, orders: oCount } };
    }));
    res.json({ restaurants: rWithCounts, totalUsers, totalOrders });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
  // Get local network IP for sharing
  const os = require('os');
  const nets = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { localIP = net.address; break; }
    }
    if (localIP !== 'localhost') break;
  }

  console.log(`\n🍽️  Restaurant System running!\n`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIP}:${PORT}  ← Share this with clients on same WiFi\n`);
  console.log(`  Demo credentials (share with clients):`);
  console.log(`  Username: demoowner`);
  console.log(`  Password: demo2026\n`);
  console.log(`  Rate limits active:`);
  console.log(`  · /api/auth     → 10 req / 15 min (brute-force protection)`);
  console.log(`  · /api/orders   → 30 req / min`);
  console.log(`  · /api/payments → 10 req / 5 min`);
  console.log(`  · /api/*        → 300 req / min (general)\n`);
});
