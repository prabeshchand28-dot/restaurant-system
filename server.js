require('dotenv').config();
const express      = require('express');
const path         = require('path');
const cors         = require('cors');
const logger       = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const {
  authLimiter,
  orderLimiter,
  paymentLimiter,
  generalLimiter,
} = require('./middleware/rateLimiter');

const app  = express();
const PORT = process.env.PORT || 3000;

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

// ── Page Routes ─────────────────────────────────────────
app.get('/',          (req, res) => res.redirect('/login'));
app.get('/login',     (req, res) => res.sendFile(path.join(__dirname, 'views/login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views/dashboard.html')));
app.get('/kitchen',   (req, res) => res.sendFile(path.join(__dirname, 'views/kitchen.html')));
app.get('/order',     (req, res) => res.sendFile(path.join(__dirname, 'views/order.html')));
app.get('/payment',   (req, res) => res.sendFile(path.join(__dirname, 'views/payment.html')));
app.get('/reports',   (req, res) => res.sendFile(path.join(__dirname, 'views/reports.html')));
app.get('/tables',    (req, res) => res.sendFile(path.join(__dirname, 'views/tables.html')));
app.get('/staff',     (req, res) => res.sendFile(path.join(__dirname, 'views/staff.html')));

// ── Error handler ────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🍽️  Restaurant System — http://localhost:${PORT}\n`);
  console.log(`  Rate limits active:`);
  console.log(`  · /api/auth     → 10 req / 15 min (brute-force protection)`);
  console.log(`  · /api/orders   → 30 req / min`);
  console.log(`  · /api/payments → 10 req / 5 min`);
  console.log(`  · /api/*        → 300 req / min (general)\n`);
});
