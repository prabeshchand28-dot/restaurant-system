# Restaurant System API Documentation

## Base URL
`http://localhost:3000`

---

## Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/password |

**Login body:** `{ "username": "admin", "password": "restaurant123" }`

---

## Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items |
| GET | `/api/menu/:id` | Get single item |
| POST | `/api/menu` | Add new item (multipart/form-data) |
| PUT | `/api/menu/:id` | Update item |
| DELETE | `/api/menu/:id` | Delete item |

**Fields:** `name`, `price`, `category`, `image` (file), `available`

---

## Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/stats` | Get order statistics |
| GET | `/api/orders/table/:t` | Get orders by table |
| GET | `/api/orders/:id` | Get single order |
| POST | `/api/orders` | Create new order |
| PATCH | `/api/orders/:id/status` | Update order status |

**Order status values:** `Pending`, `Preparing`, `Completed`, `Cancelled`

---

## Guests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/guests` | Get all guest entries |
| POST | `/api/guests` | Add/update guest info |

**Fields:** `table`, `count`, `gender`

---

## Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | Get all payments |
| GET | `/api/payments/summary` | Payment summary |
| POST | `/api/payments` | Process payment |

**Fields:** `orderId`, `method` (Cash/Card/QR Payment), `amountPaid`

---

## Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables` | Get all tables |
| POST | `/api/tables` | Add table |
| DELETE | `/api/tables/:no` | Delete table |
| GET | `/api/tables/:no/qr` | Get QR code data URL |

---

## Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/summary` | Full daily summary |

---

## Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/events` | SSE real-time events |
| GET | `/api/dashboard/summary` | Dashboard summary |

---

## Pages
| URL | Description |
|-----|-------------|
| `/login` | Admin login |
| `/dashboard` | Admin dashboard |
| `/kitchen` | Kitchen display |
| `/order?table=1` | Customer order page |
| `/payment?orderId=1` | Payment page |
| `/reports` | Reports page |
| `/tables` | Table management |
# 🍽️ Restaurant System — Complete Notes

## 📁 Project Structure
```
restaurant-system/
├── server.js                    ← Main server (Express)
├── .env                         ← Environment variables
├── package.json
├── config/
│   └── database.js              ← JSON file database (all data)
├── routes/
│   ├── auth.js                  ← Login, password change, OTP reset
│   ├── menu.js                  ← Menu CRUD + image upload
│   ├── orders.js                ← Orders + call bell
│   ├── guests.js                ← Guest info
│   ├── payments.js              ← Payment processing
│   ├── tables.js                ← Table management + QR
│   ├── reports.js               ← Summary reports
│   ├── dashboard.js             ← SSE real-time events
│   ├── ratings.js               ← Customer ratings
│   ├── staff.js                 ← Staff CRUD
│   ├── reservations.js          ← Table reservations
│   └── inventory.js             ← Stock management
├── middleware/
│   ├── auth.js                  ← JWT authentication
│   ├── upload.js                ← Multer file upload
│   ├── errorHandler.js          ← Global error handler
│   └── logger.js                ← Request logging (morgan)
├── services/
│   ├── notificationService.js   ← SSE real-time notifications
│   ├── paymentService.js        ← Payment processing logic
│   ├── reportService.js         ← Report generation
│   ├── qrService.js             ← QR code generation
│   └── otpService.js            ← OTP for password reset
├── utils/
│   ├── constants.js             ← App constants
│   ├── helpers.js               ← Helper functions
│   ├── qrGenerator.js           ← QR code generator
│   └── receiptGenerator.js      ← Receipt generator
├── views/
│   ├── login.html               ← Admin login
│   ├── dashboard.html           ← Admin dashboard (advanced)
│   ├── kitchen.html             ← Kitchen display
│   ├── order.html               ← Customer order page (QR)
│   ├── payment.html             ← Payment page
│   ├── reports.html             ← Reports page
│   ├── tables.html              ← Table QR management
│   └── staff.html               ← Staff management page
├── public/
│   ├── css/
│   │   ├── style.css            ← Shared styles
│   │   ├── dashboard.css        ← Dashboard styles
│   │   ├── order.css            ← Order page styles
│   │   ├── login.css            ← Login styles
│   │   └── i18n.css             ← Language switcher styles
│   └── js/
│       ├── dashboard.js         ← Dashboard logic
│       ├── order.js             ← Order page logic
│       ├── login.js             ← Login logic
│       └── i18n.js              ← Language translations
├── uploads/
│   ├── menu/                    ← Menu item photos
│   ├── qr/                      ← QR code images
│   └── receipts/                ← Receipt files
└── database/
    └── restaurant.db.json       ← All data stored here
```

---

## 🌐 Pages & URLs

| URL | Description | Access |
|-----|-------------|--------|
| `/login` | Admin login | Public |
| `/dashboard` | Admin dashboard | Admin/Manager |
| `/kitchen` | Kitchen display | Kitchen staff |
| `/order?table=1` | Customer order (QR scan) | Public |
| `/payment?orderId=1` | Payment page | Staff |
| `/reports` | Reports page | Admin/Manager |
| `/tables` | Table QR management | Admin |
| `/staff` | Staff management | Admin |

---

## 🔑 Login Credentials
```
Admin:   admin / restaurant123
Staff:   waiter1 / staff123
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/reset-password` | Reset password |

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items |
| POST | `/api/menu` | Add item (with photo) |
| PUT | `/api/menu/:id` | Update item |
| DELETE | `/api/menu/:id` | Delete item |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/stats` | Order statistics |
| POST | `/api/orders` | Create order |
| PATCH | `/api/orders/:id/status` | Update status |
| POST | `/api/orders/:id/call-bell` | Call staff |

### Others
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/guests` | Guest info |
| GET/POST | `/api/payments` | Payments |
| GET/POST/PUT/DELETE | `/api/tables` | Table management |
| GET | `/api/tables/:no/qr` | Get QR data URL |
| GET | `/api/reports/summary` | Full report |
| GET | `/api/dashboard/events` | SSE real-time |
| POST | `/api/ratings` | Submit rating |
| GET/POST/PUT/DELETE | `/api/staff` | Staff management |
| GET/POST/PUT/DELETE | `/api/reservations` | Reservations |
| GET/POST/PUT/DELETE | `/api/inventory` | Inventory |

---

## ✅ Features Complete

### 🖥️ Admin Dashboard
- ⏰ **Live Clock** — Real-time HH:MM:SS
- 🔔 **Notifications Panel** — Bell icon, live alerts
- 📊 **Quick Stats Bar** — Revenue, Orders, Pending, Guests, Rating, Bookings
- 📈 **Revenue Chart** — Hourly line chart (Chart.js)
- 🍽️ **Top Items Chart** — Doughnut chart
- ⏰ **Peak Hours Chart** — Bar chart
- 💰 **Revenue Summary** — Today / Week / Month
- 📅 **Reservations** — Add, edit, delete, status
- 📦 **Inventory** — Stock track, low stock alert
- 👤 **Staff Management** — Add, edit, deactivate, delete
- 🪑 **Tables & QR** — Add tables, generate QR codes, print
- 🚪 **Logout** Button

### 🍽️ Menu Management
- Add / Edit / Delete items
- 📷 Photo upload
- ⭐ Featured / Best item toggle
- 🌾 Allergen tags (Gluten, Dairy, Nuts, Eggs, Seafood, Soy, Spicy)
- ⏱ Wait time per item
- 💰 Discount (%) per item

### 👨‍🍳 Kitchen Display (`/kitchen`)
- ⏱️ Live timer (MM:SS) per order
- 🚨 Priority system:
  - ✅ Green — 0-8 min (ON TIME)
  - ⚠️ Orange — 8-15 min (DELAYED)
  - 🔴 Red — 15+ min (URGENT)
- 🔔 Sound alert (Web Audio API)
- 📊 Stats bar — Pending/Preparing/Done
- Filter — All / Pending / Preparing
- 🖨️ Print kitchen ticket
- SSE real-time (no refresh needed)

### 📱 Customer Order Page (`/order?table=X`)
- 🌐 Language: **English / 日本語**
- 👨👩🧑👧 **Guest counter** — Individual count per type
- 🍽️ Menu with:
  - ⭐ Featured/Best tab
  - 🌾 Allergen tags
  - ⏱ Wait time
  - 💰 Discount price display
- 🛒 Cart with real-time total
- ⏱ **Wait time banner** after ordering
- 📋 **My Orders** tab — order history + live status
- 🔔 **Call Bell** — Water, Cutlery, Bill, Help, etc.
- ⭐ **Rating** — Overall, Food, Service + comment

### 🔐 Login System
- Password change (current → new)
- Forgot password → OTP → Reset
- OTP shown in server terminal (production: email/SMS)
- Password strength indicator
- Show/Hide password toggle

### 👤 Staff Management
- Roles: Admin / Manager / Waiter / Kitchen
- Add, edit, deactivate, delete
- Cannot delete admin (id:1)

### 💳 Payment
- Cash / Card / QR Payment
- Change calculator (cash)
- Receipt generation + print

### 📊 Reports
- Revenue by period
- Top selling items
- Guest breakdown
- Payment methods
- Order status breakdown

### 🌐 Language (i18n)
- Dashboard: EN / 日本語 / नेपाली
- Order page: EN / 日本語

---

## ⚙️ .env Configuration
```
PORT=3000
JWT_SECRET=restaurant_secret_key_2024
RESTAURANT_NAME=My Restaurant
BASE_URL=http://172.20.10.3:3000    ← Update to your Mac IP
ADMIN_USERNAME=admin
ADMIN_PASSWORD=restaurant123
```

## 🚀 Run Commands
```bash
# Install dependencies
npm install

# Start server
node server.js

# Check server
curl http://localhost:3000
```

## 📦 Dependencies
```json
{
  "express": "^4.18.0",
  "multer": "^1.4.5",
  "qrcode": "^1.5.3",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "dotenv": "^16.0.0",
  "morgan": "^1.10.0",
  "cors": "^2.8.5"
}
```

## ⚠️ Important Notes
1. **Database** — JSON file (`database/restaurant.db.json`) — server restart गर्दा data हराउँदैन
2. **QR Code** — `BASE_URL` मा Mac को IP राख्नुस् (phone बाट access गर्न)
3. **OTP** — Server terminal मा देखिन्छ (production मा email/SMS थप्नुस्)
4. **File uploads** — `uploads/menu/` folder मा save हुन्छ
5. **SSE** — Real-time notifications को लागि `/api/dashboard/events` use गर्छ

---

*Last updated: June 2026*