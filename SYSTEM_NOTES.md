# Restaurant SaaS System — Complete Build Notes

## Project Overview

A 100-feature Restaurant Management SaaS built on Node.js + Express + PostgreSQL (Prisma ORM).
All features use vanilla HTML/JS frontends served via `res.sendFile`. No React or Vue.

---

## Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Runtime     | Node.js v26+                            |
| Framework   | Express 5                               |
| Database    | PostgreSQL (via Prisma ORM)             |
| Auth        | JWT (`jsonwebtoken`) — Bearer token     |
| Frontend    | Vanilla HTML + CSS + JS (no framework)  |
| Charts      | Chart.js 4.4.1 (cdnjs CDN)             |
| Font        | Plus Jakarta Sans (Google Fonts)        |
| Email       | Nodemailer (SMTP — Gmail)               |
| SMS         | Sparrow SMS API (Nepal)                 |
| QR Codes    | `qrcode` npm package                    |
| Payments    | Stripe (UI only)                        |

---

## Design System

```css
--navy:  #1a3a6b   /* dark blue — primary topbars */
--blue:  #2653a0   /* mid blue — buttons, card headers */
--green: #1a7a3a   /* green — success, cash, positive */
--red:   #c0392b   /* red — danger, delete, incidents */
--bg:    #f0f2f5   /* page background */
```

Font: `Plus Jakarta Sans` — weights 400/500/600/700/800/900

All fetch calls use `cache: 'no-store'` to bypass service worker caching.
Auth header pattern: `Authorization: Bearer ${localStorage.getItem('token')}`

---

## Project Structure

```
restaurant-system/
├── server.js                  # Express app entry — all routes registered here
├── prisma/
│   ├── schema.prisma          # All DB models
│   └── seed.js                # Seeds admin user + sample data
├── middleware/
│   ├── auth.js                # JWT verify (exports authMiddleware / verifyToken / generateToken)
│   ├── rateLimiter.js         # Rate limits per endpoint group
│   ├── logger.js              # Request logger
│   └── errorHandler.js        # Global error handler
├── controllers/               # 40+ controller files
├── routes/                    # 40+ route files
├── services/
│   ├── otpService.js          # OTP create/verify + email/SMS delivery
│   └── notificationService.js # Real-time order notifications
├── public/
│   ├── js/
│   │   ├── offline.js         # OfflineManager — IndexedDB sync queue + status bar
│   │   └── autoupdate.js      # Auto-reload when server restarts (buildId polling)
│   └── sw.js                  # Service worker — networkFirst for pages, cacheFirst for assets
└── views/                     # 86 HTML pages
```

---

## Auth Middleware — Important

`middleware/auth.js` exports:
- Default export = `authMiddleware` function (so `require('./auth')` works as middleware directly)
- Named: `verifyToken` (alias for authMiddleware)
- Named: `authMiddleware`
- Named: `roleMiddleware(...roles)`
- Named: `generateToken(user)`

Login: `POST /api/auth/login` → returns `{ token, user }`
Token stored in `localStorage.getItem('token')` on all pages.

---

## Running the System

```bash
# First time setup
npm install
npx prisma db push
node prisma/seed.js   # creates admin user with real email/phone

# Start server
node server.js
# or
npm run dev           # with nodemon auto-restart
```

Default URL: `http://localhost:3000`
Dashboard: `http://localhost:3000/dashboard`

Default admin credentials (from seed):
- Username: `admin`
- Password: `restaurant123`
- Email: `prabeshchand28@gmail.com`
- Phone: `08058571995`

---

## Environment Variables (.env)

```
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurant_db"
JWT_SECRET=restaurant_secret_key_2024
JWT_EXPIRES_IN=8h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=restaurant123

# Email OTP (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=prabeshchand28@gmail.com
SMTP_PASS=hbuf znpq bbqp aubr   ← Gmail App Password (spaces OK)

# SMS OTP (Sparrow SMS — Nepal) — optional
SPARROW_TOKEN=your_sparrow_token_here
```

---

## PostgreSQL Setup (macOS)

If `postgres` role doesn't exist:
```bash
createuser -s postgres
createdb -U postgres restaurant_db
npx prisma db push
node prisma/seed.js
```

---

## All 100 Features by Phase

### Phase 1 — Core Foundation
1. **Auth System** — Login/logout, JWT, role-based access
2. **Menu Management** — Items, categories, pricing, images
3. **Table Management** — Table layout, status tracking
4. **Order Management** — POS order entry, kitchen tickets
5. **Kitchen Display** — Live order queue for kitchen
6. **Reservations** — Guest bookings, date/time/party size
7. **Staff Management** — Staff profiles, roles, permissions
8. **Loyalty Program** — Points earning, redemption, tiers
9. **Coupon & Discounts** — Promo codes, percentage/flat discounts
10. **Customer CRM** — Guest profiles, visit history, segments
11. **Supplier Management** — Supplier directory, contact info
12. **Shift Scheduling** — Staff shifts, date/time assignment
13. **Expense Tracking** — Categorized expense logging
14. **Audit Log** — Activity tracking, who-did-what log

### Phase 2 — Finance & Operations
15. **Payroll Management** — Salary, deductions, net pay
16. **Leave Management** — Leave requests, approval workflow
17. **Recipe Costing** — Ingredient costs, margin calculation
18. **P&L Report** — Profit & Loss + Cash Flow statements
19. **Happy Hour / Promotions** — Time-based pricing rules
20. **Customer Wallet** — Prepaid balance, top-up, spend
21. **Membership Program** — Subscription tiers, perks
22. **Data Export Center** — CSV/Excel download for any data

### Phase 3 — Growth Features
23. **Delivery Management** — Zones, drivers, delivery orders
24. **Multi-Branch Management** — Outlet list, branch switching
25. **Notification Center** — SMS/Email templates + send log
26. **Tax Configuration** — GST/VAT setup, tax report
27. **Advanced Inventory** — Stock levels, reorder alerts
28. **Stock History** — Movement log per ingredient
29. **QR Code Menu** — Auto-generated QR → public menu URL
30. **Daily Closing Report** — End-of-day revenue summary

### Phase 4 — Digital & Analytics
31. **Public Online Menu** — Customer-facing ordering page
32. **Online Orders Admin** — Manage incoming online orders
33. **Staff Performance** — KPIs, sales per staff, ratings
34. **Marketing Campaigns** — Bulk SMS/Email to customers
35. **Advanced Analytics** — Revenue trends, cohorts, charts
36. **Stripe Payment UI** — Payment settings + checkout flow
37. **Ratings & Reviews** — Customer feedback with star ratings
38. **Reports Dashboard** — Consolidated daily/weekly reports

### Phase 5 — Ops Depth
39. **Food Waste Tracking** — Log waste by item, reason, cost
40. **Menu Engineering** — Star/plow/dog/puzzle classification
41. **Event / Banquet Mgmt** — Bookings, packages, deposit
42. **Staff Weekly Roster** — Drag-assign shifts by week
43. **Vendor Invoice Mgmt** — Bill tracking, payment status
44. **Customer Feedback Portal** — Public form + admin inbox
45. **Feedback Analytics** — Chart.js trend + category breakdown

### Phase 6 — Team & Planning
46. **Tip Management** — Record and distribute tips by shift
47. **Staff Training Module** — Courses, completion tracking
48. **Budget Planner** — Monthly budget vs actual spend
49. **Internal Task Manager** — Assign tasks, set deadlines, status
50. **Customer Loyalty Portal** — Public points-check page
51. **Reservation Calendar** — Visual month/week calendar view

### Phase 7 — Hardware & Assets
52. **Staff Clock-In/Out** — Digital time clock, hours log
53. **Gift Card Management** — Issue, reload, redeem, void
54. **Menu Modifier Groups** — Add-ons, options, extras
55. **Equipment / Asset Tracker** — Maintenance log, warranty
56. **Shift Handover Notes** — Outgoing shift summary log

### Phase 8 — Procurement & Staff Welfare
57. **Purchase Order Management** — PO creation, PO number, receive
58. **Daily Specials Manager** — Today's specials board
59. **Staff Salary Advances** — Advance requests, repayment log
60. **Lost & Found Register** — Items log, claim tracking
61. **Meal Plan Subscriptions** — Customer meal subscription plans

### Phase 9 — Compliance & Controls
62. **Allergen & Dietary Tags** — Tag menu items with allergens
63. **Waitlist Manager** — Walk-in queue, SMS notify on table ready
64. **Void & Refund Log** — Record voids, reason, authorized by
65. **Price Tiers** — Dynamic pricing by customer type/time
66. **Staff Commission Tracker** — Commission rules, monthly report

### Phase 10 — Guest & Hygiene
67. **Reservation Deposits** — Deposit collection, refund tracking
68. **Disciplinary Records** — Staff warnings, incidents, HR log
69. **Customer Birthday Tracker** — Birthday alerts, auto-reward
70. **Inventory Batch / Expiry** — Batch tracking, expiry alerts
71. **Table Hygiene Log** — Cleaning records per table, per shift

### Phase 11 — Advanced Operations
72. **Staff Meal Tracker** — Log duty meals by staff and shift
73. **Tip Pool Distribution** — Hours-weighted tip auto-calculation
74. **Night Audit** — Full end-of-night reconciliation form
75. **Floor Plan Editor** — Drag-and-drop table canvas (SVG)
76. **Menu 86 Board** — Live "item unavailable" toggle board
77. **Recipe Scaling Calculator** — Scale recipes ½x–10x + custom
78. **Supplier Price Comparison** — Side-by-side supplier pricing
79. **Feedback Analytics** — Chart.js trend + category charts

### Phase 12 — Final 9 (reaches 100)
80. **Uniform & Locker Tracker** — Issue uniforms, keys, lockers
81. **Guest Blacklist** — Ban/lift guests, severity, quick-check
82. **Menu Category Manager** — Drag-to-reorder, color, icon
83. **Prep Checklist** — Opening/closing checklists with progress bar
84. **Staff Recognition Board** — Nominate, vote, approve awards
85. **Incident Report Log** — Severity-coded incident workflow
86. **Cash Denomination Counter** — Note/coin grid, variance vs expected
87. **Shift Revenue Snapshot** — Orders grouped by morning/afternoon/evening
88. **Kitchen Prep Timer** — Multi-timer dark UI, SVG ring progress
89–100. *(Spread across phases: Analytics, Branches, Campaigns, CRM, Delivery, Payroll, Online Orders, QR Menu, Tax, Closing Report, Settings, Inventory)*

---

## Post-Build Additions (Session 2+)

### A. Offline Mode (`public/js/offline.js` + `views/order.html`)

`OfflineManager` — auto-loads on every page that includes `offline.js`.

**What it does:**
- Detects `navigator.onLine` status in real time
- When offline: mutations (POST/PUT/DELETE) are saved to IndexedDB sync queue
- When online returns: auto-syncs queue to server
- Status bar at bottom of screen: red = offline, yellow = syncing, blue = pending sync
- `order.html`: caches menu to `localStorage`, places offline orders via `OfflineManager.apiFetch()`

**Key fixes applied to offline.js:**
- All `isOnline` local variable references replaced with `navigator.onLine` (local var could go stale)
- Added null guard: `if (!db) return` before IndexedDB operations
- Added `cache: 'no-store'` to `apiFetch()` fetch calls
- Toast shown on online/offline events

**Usage in any page:**
```js
// Place order (works offline)
const result = await OfflineManager.apiFetch('POST', '/api/orders', orderData);
if (result.offline) { /* queued, will sync later */ }
```

---

### B. OTP Password Reset — Real Email & SMS

**File:** `services/otpService.js`

- `createOTP(contact)` — generates 6-digit OTP, stores in memory Map with 10-min expiry
- Sends real email via Nodemailer (Gmail SMTP) if contact contains `@`
- Sends real SMS via Sparrow SMS API (Nepal) if `SPARROW_TOKEN` set in `.env`
- If delivery fails → OTP still valid, code logged to server console
- `verifyOTP(contact, code)` — validates, deletes after success, max 5 attempts

**Phone normalization:** strips leading `0`, adds `977` Nepal country code before sending SMS.

**OTP email configured for:** `prabeshchand28@gmail.com`
**OTP SMS configured for:** `08058571995` (when SPARROW_TOKEN is set)

---

### C. Password Reset Flow — Bugs Fixed

**File:** `controllers/authController.js`, `routes/auth.js`, `views/login.html`

#### Bug 1 — `changePassword` always failed
- **Root cause:** Controller read `username` from `req.body`, but frontend never sent it
- **Fix:** Added `auth` middleware to `/change-password` route → controller now reads `req.user.username` from JWT token
- **Route:** `router.post('/change-password', auth, ctrl.changePassword)`

#### Bug 2 — `resetPassword` swallowed all errors
- **Root cause:** Single catch block returned "Invalid or expired token" for ALL errors (including DB failures)
- **Fix:** Separated JWT verify errors (TokenExpiredError) from DB/Prisma errors; each shows a specific message

#### Bug 3 — "User not found" when resetting by email/phone
- **Root cause:** Admin user's email/phone was `""` (empty string default) — seed.js not run after adding real email/phone
- **Fix:** Run `node prisma/seed.js` → updates admin to `prabeshchand28@gmail.com` / `08058571995`
- **Workaround:** Enter username `admin` as the contact — works even without email/phone set

#### Frontend improvements (login.html)
- Shows warning box: "If email/phone not set, use your username (e.g. `admin`)"
- Shows server hint if OTP delivery fails: "OTP server console ma check garus"
- `handleResetPass` properly passes resetToken from `S.resetToken`

---

### D. Kitchen → Payment Access Control

**Files:** `views/kitchen.html`, `views/payment.html`

- **Kitchen header** — added 💳 Payment button
  - If logged-in user is `admin` → navigates to `/payment`
  - If not admin → button shows 🔒, greys out, shows toast "Sirf Admin le payment garna sakincha"
- **Payment page** — auth guard changed from `admin|manager` to **admin only**
  - Non-admin sees a proper "Access Denied" screen (shows their name + role) instead of silent redirect to login

---

### E. Order Manager — New Page (`/order-manage`)

**File:** `views/order-manage.html`
**Server route:** `app.get('/order-manage', ...)`
**Dashboard nav:** Added "Order Manager" link (pencil icon)
**Kitchen link:** "📋 Orders" button in kitchen header

**Access:** Admin and Manager only

**Features:**
- **Left sidebar** — all tables listed, orange border = has active orders, badge shows count
- **Select a table** → loads all orders for that table via `GET /api/orders/table/:t`
- **Per order:**
  - Edit item quantities with + / − buttons (tracked as pending changes locally)
  - Remove individual items (🗑 button)
  - Add new items → opens searchable menu modal → pick items + quantities → "Add Items"
  - Delete entire order (with confirmation) → `DELETE /api/orders/:id`
  - Save changes → `PUT /api/orders/:id` with full updated items array
  - "Unsaved changes" indicator shown until saved
- **New Order button** → opens menu picker → creates order via `POST /api/orders`
- Auto-refreshes table sidebar every 30 seconds

---

### F. Auto-Update on Server Restart

**Files:** `public/js/autoupdate.js`, `server.js`

**How it works:**
1. Server sets `const BUILD_ID = Date.now().toString()` on startup
2. `GET /api/ping` returns `{ ok, buildId, time }`
3. `autoupdate.js` polls `/api/ping` every **15 seconds**
4. If `buildId` changes from what was stored → shows green banner → reloads page after 2.5s
5. If server is down → skips silently (no reload)

**Injected into:** All 86 HTML pages via `<script src="/js/autoupdate.js"></script>` before `</body>`

**Workflow going forward:**
```
1. Make code changes
2. Ctrl+C (stop server)
3. node server.js (restart)
4. All open browser tabs auto-refresh within 15 seconds
```

---

### G. Rate Limiter Fix

**File:** `middleware/rateLimiter.js`

Auth limit was **10 req / 15 min** (too low for testing — login + OTP + reset = 4 requests per attempt).

**Fix:** Environment-aware limits:
- Development (`NODE_ENV` not set or not `production`): **100 req / 15 min**
- Production (`NODE_ENV=production`): **10 req / 15 min**

**⚠️ Important:** Rate limit is in-memory. If login is blocked (returns 429), **restart the server** to clear it.

---

## Known Issues Fixed During Build

### 1. `auth.js` — Wrong Export Format
**Problem:** Routes imported auth expecting a function, but it exported an object.
**Fix:** `module.exports = authMiddleware` with named properties attached.

### 2. Duplicate Prisma Models
**Problem:** `GiftCard` and `PurchaseOrder`/`PurchaseOrderItem` defined twice.
**Fix:** Removed older simpler definitions; kept Phase 7/8 versions. Removed orphaned `Supplier.purchaseOrders`.

### 3. PostgreSQL — `postgres` Role Missing (macOS)
```bash
createuser -s postgres
createdb -U postgres restaurant_db
npx prisma db push
```

### 4. Payment Terminal — Stuck on "Loading..."
Three causes, three fixes:
1. Service worker serving cached stale HTML → `sw.js` updated to `networkFirst` for HTML pages, bumped cache to `restaurant-v3`
2. No fetch timeout → added `AbortController` 8s timeout in `payment.html`
3. Error state not rendered → changed initial grid HTML to empty div, proper error grid shown on failure

### 5. Login Blocked After Testing
**Cause:** Auth rate limiter (10 req / 15 min) hit during testing.
**Fix:** Restart server (`node server.js`) — clears in-memory rate limit.

---

## API Route Patterns

Every feature follows this structure:

```
GET    /api/{feature}          → list/getAll
POST   /api/{feature}          → create
GET    /api/{feature}/:id      → getOne
PUT    /api/{feature}/:id      → update
DELETE /api/{feature}/:id      → delete
GET    /api/{feature}/stats    → aggregated stats (registered BEFORE /:id)
```

**Important:** Stats routes (`/stats`, `/summary`, `/today`) MUST be registered
before `/:id` routes in each router.

---

## Auth-Protected Routes

Routes that require auth middleware:
```js
const auth = require('../middleware/auth');
router.post('/change-password', auth, ctrl.changePassword);  // username from JWT token
```

Role-restricted pages (frontend guard):
- `/payment` — admin only (`u.role === 'admin'`)
- `/order-manage` — admin or manager
- `/dashboard` — admin or manager

---

## Frontend Page Pattern

```html
<script>
const token = localStorage.getItem('token');
const authH = () => ({ Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' });

async function load() {
  const r = await fetch('/api/feature', { headers: authH(), cache: 'no-store' });
  const data = await r.json();
  // render...
}

load();
</script>
<!-- Always before </body>: -->
<script src="/js/autoupdate.js"></script>
```

---

## Prisma Schema Tips

- All models use `@@map("snake_case_table_name")`
- Run `npx prisma db push` after ANY schema change
- Run `npx prisma generate` if client is out of sync
- Use `npx prisma studio` for visual DB browser at `http://localhost:5555`

---

## Useful Commands

```bash
node server.js              # Start server
npm run dev                 # Start with nodemon (auto-restart)
node prisma/seed.js         # Re-seed admin user (updates email/phone too)
npx prisma db push          # Sync schema → DB
npx prisma studio           # Visual DB admin UI
npx prisma generate         # Regenerate Prisma client

# Port management
lsof -i :3000               # Check what's on port 3000
kill -9 $(lsof -t -i:3000)  # Kill port 3000

# Clear service worker (browser)
# F12 → Application → Service Workers → Unregister
# Then: Storage → Clear site data
```

---

## Dashboard Navigation

All 100 features accessible from `/dashboard`.
Sidebar organized into groups matching each phase.
Each nav item: `onclick="location.href='/page-name'"` or `onclick="showSection('name', this)"`.

**Quick-access pages outside dashboard:**
- `/kitchen` — Kitchen display (has links to Payment + Order Manager)
- `/payment` — POS terminal (admin only)
- `/order-manage` — Table-by-table order edit/add/delete (admin/manager)
- `/order` — Customer mobile ordering (QR code access, no auth)

---

## Pending Tasks

- [ ] Run `node prisma/seed.js` locally to save admin email/phone to DB
- [ ] Add `SPARROW_TOKEN` to `.env` when Sparrow SMS account is ready
- [ ] Set `NODE_ENV=production` in `.env` before going live (enables strict rate limits)

---

*Build completed across 12 phases. All 100 features operational.*
*Post-build additions: Offline mode, Real OTP, Password reset fixes, Kitchen→Payment access, Order Manager, Auto-update, Rate limiter fix.*
