// prisma/seed.js — Comprehensive sample data
// Run: node prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with sample restaurant data...\n');

  // ── USERS ────────────────────────────────────────────────────
  console.log('👤 Creating staff users...');
  const users = [
    { username: 'admin',    password: 'restaurant123', name: 'Admin User',      role: 'admin',   email: 'admin@uena.com',    phone: '9801234567' },
    { username: 'demoowner', password: 'demo2026',      name: 'Demo Owner',      role: 'manager', email: 'demo@uena.com',     phone: '9800000099' },
    { username: 'manager1', password: 'manager123',    name: 'Sita Sharma',     role: 'manager', email: 'sita@uena.com',     phone: '9802345678' },
    { username: 'chef1',    password: 'chef123',       name: 'Ram Bahadur',     role: 'kitchen', email: 'ram@uena.com',      phone: '9803456789' },
    { username: 'chef2',    password: 'chef123',       name: 'Kamal Thapa',     role: 'kitchen', email: 'kamal@uena.com',    phone: '9804567890' },
    { username: 'waiter1',  password: 'staff123',      name: 'Hari Prasad',     role: 'waiter',  email: 'hari@uena.com',     phone: '9805678901' },
    { username: 'waiter2',  password: 'staff123',      name: 'Gita Karki',      role: 'waiter',  email: 'gita@uena.com',     phone: '9806789012' },
    { username: 'cashier1', password: 'staff123',      name: 'Binod Shrestha',  role: 'cashier', email: 'binod@uena.com',    phone: '9807890123' },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { username: u.username }, update: { email: u.email, phone: u.phone }, create: u });
  }
  console.log('  ✓ ' + users.length + ' users created');

  // ── RESTAURANT TABLES ─────────────────────────────────────────
  console.log('🪑 Creating tables 1–16...');
  const tableConfigs = [
    { n: 1, cap: 2 }, { n: 2, cap: 4 }, { n: 3, cap: 4 }, { n: 4, cap: 6 },
    { n: 5, cap: 2 }, { n: 6, cap: 4 }, { n: 7, cap: 4 }, { n: 8, cap: 8 },
    { n: 9, cap: 2 }, { n: 10, cap: 4 }, { n: 11, cap: 4 }, { n: 12, cap: 6 },
    { n: 13, cap: 4 }, { n: 14, cap: 4 }, { n: 15, cap: 10 }, { n: 16, cap: 2 },
  ];
  for (const { n, cap } of tableConfigs) {
    await prisma.restaurantTable.upsert({ where: { number: n }, update: {}, create: { number: n, capacity: cap } });
  }
  console.log('  ✓ 16 tables created');

  // ── MENU ITEMS ────────────────────────────────────────────────
  console.log('🍽️  Creating menu items...');
  const menuItems = [
    { name: 'Chicken Momo',        price: 180, category: 'Snacks',    waitMins: 12, allergens: ['Gluten'], featured: true },
    { name: 'Veg Momo',            price: 150, category: 'Snacks',    waitMins: 10, allergens: ['Gluten'] },
    { name: 'Spring Roll',         price: 160, category: 'Snacks',    waitMins: 10, allergens: ['Gluten'] },
    { name: 'Crispy Chicken',      price: 220, category: 'Snacks',    waitMins: 15, allergens: ['Gluten'] },
    { name: 'Garlic Bread',        price: 120, category: 'Snacks',    waitMins: 8,  allergens: ['Gluten', 'Dairy'], discount: 10 },
    { name: 'Chicken Chowmein',    price: 200, category: 'Noodles',   waitMins: 12, allergens: ['Gluten'], featured: true },
    { name: 'Thukpa',              price: 200, category: 'Noodles',   waitMins: 15, allergens: [] },
    { name: 'Veg Fried Rice',      price: 180, category: 'Rice',      waitMins: 10, allergens: [] },
    { name: 'Chicken Fried Rice',  price: 220, category: 'Rice',      waitMins: 12, allergens: [] },
    { name: 'Dal Bhat Set',        price: 280, category: 'Main',      waitMins: 18, allergens: [], featured: true },
    { name: 'Chicken Curry',       price: 320, category: 'Main',      waitMins: 20, allergens: [] },
    { name: 'Mutton Curry',        price: 380, category: 'Main',      waitMins: 25, allergens: [] },
    { name: 'Paneer Butter Masala',price: 300, category: 'Main',      waitMins: 20, allergens: ['Dairy'] },
    { name: 'Grilled Fish',        price: 350, category: 'Main',      waitMins: 22, allergens: ['Fish'] },
    { name: 'Chicken Burger',      price: 250, category: 'Fast Food', waitMins: 10, allergens: ['Gluten', 'Dairy'], featured: true, discount: 15 },
    { name: 'Veg Burger',          price: 200, category: 'Fast Food', waitMins: 8,  allergens: ['Gluten', 'Dairy'] },
    { name: 'Margherita Pizza',    price: 380, category: 'Fast Food', waitMins: 22, allergens: ['Gluten', 'Dairy'] },
    { name: 'Fresh Lime Soda',     price:  80, category: 'Drinks',    waitMins: 3,  allergens: [] },
    { name: 'Mango Lassi',         price: 120, category: 'Drinks',    waitMins: 4,  allergens: ['Dairy'], discount: 20 },
    { name: 'Masala Chai',         price:  60, category: 'Drinks',    waitMins: 5,  allergens: ['Dairy'] },
    { name: 'Cold Coffee',         price: 140, category: 'Drinks',    waitMins: 5,  allergens: ['Dairy'], featured: true },
    { name: 'Gulab Jamun',         price: 100, category: 'Desserts',  waitMins: 5,  allergens: ['Dairy', 'Gluten'] },
    { name: 'Ice Cream (2 Scoops)',price: 130, category: 'Desserts',  waitMins: 3,  allergens: ['Dairy'] },
  ];
  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (!existing) await prisma.menuItem.create({ data: item });
  }
  console.log('  ✓ ' + menuItems.length + ' menu items created');

  // ── INVENTORY ─────────────────────────────────────────────────
  console.log('📦 Creating inventory...');
  const inventoryData = [
    { name: 'Rice',            quantity: 45.0, unit: 'kg',  minStock: 10, category: 'Grains' },
    { name: 'Wheat Flour',     quantity: 18.0, unit: 'kg',  minStock: 5,  category: 'Grains' },
    { name: 'Cooking Oil',     quantity: 8.0,  unit: 'L',   minStock: 3,  category: 'Cooking' },
    { name: 'Chicken (Fresh)', quantity: 6.5,  unit: 'kg',  minStock: 5,  category: 'Protein' },
    { name: 'Mutton',          quantity: 3.0,  unit: 'kg',  minStock: 2,  category: 'Protein' },
    { name: 'Milk',            quantity: 12.0, unit: 'L',   minStock: 4,  category: 'Dairy' },
    { name: 'Butter',          quantity: 1.5,  unit: 'kg',  minStock: 1,  category: 'Dairy' },
    { name: 'Eggs',            quantity: 60.0, unit: 'pcs', minStock: 20, category: 'Protein' },
    { name: 'Onions',          quantity: 10.0, unit: 'kg',  minStock: 3,  category: 'Vegetables' },
    { name: 'Tomatoes',        quantity: 7.0,  unit: 'kg',  minStock: 2,  category: 'Vegetables' },
    { name: 'Potatoes',        quantity: 15.0, unit: 'kg',  minStock: 5,  category: 'Vegetables' },
    { name: 'Garlic',          quantity: 0.8,  unit: 'kg',  minStock: 0.5,category: 'Spices' },
    { name: 'Ginger',          quantity: 0.5,  unit: 'kg',  minStock: 0.3,category: 'Spices' },
    { name: 'Masala (Mixed)',  quantity: 2.0,  unit: 'kg',  minStock: 0.5,category: 'Spices' },
    { name: 'Tea Leaves',      quantity: 1.8,  unit: 'kg',  minStock: 0.5,category: 'Beverages' },
    { name: 'Coffee Powder',   quantity: 0.9,  unit: 'kg',  minStock: 0.3,category: 'Beverages' },
    { name: 'Sugar',           quantity: 8.0,  unit: 'kg',  minStock: 2,  category: 'Basics' },
    { name: 'Salt',            quantity: 3.0,  unit: 'kg',  minStock: 1,  category: 'Basics' },
  ];
  for (const item of inventoryData) {
    const existing = await prisma.inventoryItem.findFirst({ where: { name: item.name } });
    if (!existing) await prisma.inventoryItem.create({ data: item });
  }
  console.log('  ✓ ' + inventoryData.length + ' inventory items created');

  // ── SUPPLIERS ─────────────────────────────────────────────────
  console.log('🏭 Creating suppliers...');
  const suppliers = [
    { name: 'Annapurna Traders',     contact: 'Ramesh Thapa',   phone: '014567890', email: 'annapurna@traders.np', address: 'Ason, Kathmandu',       category: 'Grains' },
    { name: 'Valley Fresh Meats',    contact: 'Gopal Maharjan', phone: '014678901', email: 'valley@fresh.np',      address: 'New Baneshwor, KTM',    category: 'Protein' },
    { name: 'Himalayan Dairy',       contact: 'Puja Shrestha',  phone: '014789012', email: 'himalayan@dairy.np',   address: 'Naxal, Kathmandu',      category: 'Dairy' },
    { name: 'Capital Spice House',   contact: 'Suresh Basnet',  phone: '014890123', email: 'capital@spice.np',     address: 'Indrachowk, KTM',       category: 'Spices' },
    { name: 'Bhat-Bhateni Wholesale',contact: 'Priya Acharya',  phone: '014901234', email: 'wholesale@bb.np',      address: 'Maharajgunj, KTM',      category: 'General' },
  ];
  for (const s of suppliers) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (!existing) await prisma.supplier.create({ data: s });
  }
  console.log('  ✓ ' + suppliers.length + ' suppliers created');

  // ── CUSTOMERS (CRM) ───────────────────────────────────────────
  console.log('👥 Creating customer profiles...');
  const today = new Date();
  const ms = (days) => new Date(today - days * 86400000);
  const customers = [
    { name: 'Anita Tamang',    phone: '9811111111', email: 'anita@gmail.com',  birthday: '03-15', visitCount: 24, totalSpent: 8200,  segment: 'VIP',     lastVisit: ms(2) },
    { name: 'Bikram Rai',      phone: '9822222222', email: 'bikram@gmail.com', birthday: '07-22', visitCount: 12, totalSpent: 4600,  segment: 'Regular', lastVisit: ms(5) },
    { name: 'Chandra Gurung',  phone: '9833333333', email: '',                 birthday: '11-08', visitCount: 8,  totalSpent: 2800,  segment: 'Regular', lastVisit: ms(7) },
    { name: 'Deepika Limbu',   phone: '9844444444', email: 'deepika@mail.com', birthday: '01-30', visitCount: 3,  totalSpent: 980,   segment: 'New',     lastVisit: ms(10) },
    { name: 'Eshan Magar',     phone: '9855555555', email: '',                 birthday: '05-14', visitCount: 31, totalSpent: 12400, segment: 'VIP',     lastVisit: ms(1) },
    { name: 'Fiona Sherpa',    phone: '9866666666', email: 'fiona@gmail.com',  birthday: '09-03', visitCount: 6,  totalSpent: 2200,  segment: 'Regular', lastVisit: ms(14) },
    { name: 'Gajendra Basnet', phone: '9877777777', email: '',                 birthday: '12-25', visitCount: 1,  totalSpent: 450,   segment: 'New',     lastVisit: ms(3) },
    { name: 'Hira Pun',        phone: '9888888888', email: 'hira@mail.np',    birthday: '06-18', visitCount: 18, totalSpent: 6800,  segment: 'VIP',     lastVisit: ms(1) },
    { name: 'Indira KC',       phone: '9899999999', email: '',                 birthday: '08-11', visitCount: 45, totalSpent: 18900, segment: 'VIP',     lastVisit: ms(0) },
    { name: 'Jeevan Bogati',   phone: '9800000001', email: 'jeevan@gmail.com', birthday: '02-28', visitCount: 9,  totalSpent: 3100,  segment: 'Regular', lastVisit: ms(6) },
    { name: 'Kamala Devi',     phone: '9800000002', email: '',                 birthday: '04-04', visitCount: 2,  totalSpent: 680,   segment: 'New',     lastVisit: ms(20) },
    { name: 'Lalit Bhandari',  phone: '9800000003', email: 'lalit@gmail.com',  birthday: '10-19', visitCount: 14, totalSpent: 5400,  segment: 'Regular', lastVisit: ms(4) },
  ];
  for (const c of customers) {
    const existing = await prisma.customerProfile.findFirst({ where: { phone: c.phone } });
    if (!existing) await prisma.customerProfile.create({ data: c });
  }
  console.log('  ✓ ' + customers.length + ' customers created');

  // ── LOYALTY ACCOUNTS ─────────────────────────────────────────
  console.log('⭐ Creating loyalty accounts...');
  const loyaltyAccounts = [
    { phone: '9811111111', name: 'Anita Tamang',   totalPoints: 820,  totalSpent: 8200,  tier: 'Gold' },
    { phone: '9855555555', name: 'Eshan Magar',    totalPoints: 1240, totalSpent: 12400, tier: 'Platinum' },
    { phone: '9888888888', name: 'Hira Pun',       totalPoints: 680,  totalSpent: 6800,  tier: 'Gold' },
    { phone: '9899999999', name: 'Indira KC',      totalPoints: 1890, totalSpent: 18900, tier: 'Platinum' },
    { phone: '9800000003', name: 'Lalit Bhandari', totalPoints: 540,  totalSpent: 5400,  tier: 'Silver' },
  ];
  for (const la of loyaltyAccounts) {
    const existing = await prisma.loyaltyAccount.findFirst({ where: { phone: la.phone } });
    if (!existing) await prisma.loyaltyAccount.create({ data: la });
  }
  console.log('  ✓ ' + loyaltyAccounts.length + ' loyalty accounts created');

  // ── ORDERS ────────────────────────────────────────────────────
  console.log('🧾 Creating sample orders...');
  const orderData = [
    { tableNumber: 1,  status: 'Completed', guestCount: 2, items: [{ name: 'Chicken Momo', price: 180, qty: 2 }, { name: 'Mango Lassi', price: 120, qty: 2 }] },
    { tableNumber: 3,  status: 'Completed', guestCount: 4, items: [{ name: 'Dal Bhat Set', price: 280, qty: 3 }, { name: 'Chicken Curry', price: 320, qty: 1 }, { name: 'Masala Chai', price: 60, qty: 4 }] },
    { tableNumber: 5,  status: 'Completed', guestCount: 2, items: [{ name: 'Chicken Burger', price: 250, qty: 2 }, { name: 'Cold Coffee', price: 140, qty: 2 }] },
    { tableNumber: 7,  status: 'Preparing', guestCount: 3, items: [{ name: 'Chicken Chowmein', price: 200, qty: 2 }, { name: 'Spring Roll', price: 160, qty: 1 }, { name: 'Fresh Lime Soda', price: 80, qty: 3 }] },
    { tableNumber: 2,  status: 'Pending',   guestCount: 4, items: [{ name: 'Mutton Curry', price: 380, qty: 2 }, { name: 'Dal Bhat Set', price: 280, qty: 2 }] },
    { tableNumber: 4,  status: 'Completed', guestCount: 6, items: [{ name: 'Margherita Pizza', price: 380, qty: 2 }, { name: 'Crispy Chicken', price: 220, qty: 2 }, { name: 'Cold Coffee', price: 140, qty: 4 }] },
    { tableNumber: 8,  status: 'Completed', guestCount: 5, items: [{ name: 'Grilled Fish', price: 350, qty: 2 }, { name: 'Veg Fried Rice', price: 180, qty: 2 }, { name: 'Fresh Lime Soda', price: 80, qty: 5 }] },
    { tableNumber: 6,  status: 'Pending',   guestCount: 2, items: [{ name: 'Paneer Butter Masala', price: 300, qty: 1 }, { name: 'Garlic Bread', price: 120, qty: 1 }, { name: 'Mango Lassi', price: 120, qty: 2 }] },
    { tableNumber: 10, status: 'Completed', guestCount: 3, items: [{ name: 'Thukpa', price: 200, qty: 3 }, { name: 'Veg Momo', price: 150, qty: 2 }] },
    { tableNumber: 11, status: 'Completed', guestCount: 4, items: [{ name: 'Chicken Fried Rice', price: 220, qty: 2 }, { name: 'Chicken Chowmein', price: 200, qty: 2 }, { name: 'Gulab Jamun', price: 100, qty: 4 }] },
    { tableNumber: 12, status: 'Preparing', guestCount: 6, items: [{ name: 'Dal Bhat Set', price: 280, qty: 4 }, { name: 'Mutton Curry', price: 380, qty: 2 }, { name: 'Masala Chai', price: 60, qty: 6 }] },
    { tableNumber: 9,  status: 'Completed', guestCount: 2, items: [{ name: 'Veg Burger', price: 200, qty: 2 }, { name: 'Ice Cream (2 Scoops)', price: 130, qty: 2 }] },
    { tableNumber: 13, status: 'Completed', guestCount: 3, items: [{ name: 'Chicken Momo', price: 180, qty: 2 }, { name: 'Chicken Curry', price: 320, qty: 1 }, { name: 'Cold Coffee', price: 140, qty: 2 }] },
    { tableNumber: 14, status: 'Pending',   guestCount: 4, items: [{ name: 'Paneer Butter Masala', price: 300, qty: 2 }, { name: 'Veg Fried Rice', price: 180, qty: 2 }, { name: 'Fresh Lime Soda', price: 80, qty: 4 }] },
    { tableNumber: 15, status: 'Completed', guestCount: 8, items: [{ name: 'Margherita Pizza', price: 380, qty: 3 }, { name: 'Chicken Burger', price: 250, qty: 4 }, { name: 'Cold Coffee', price: 140, qty: 6 }, { name: 'Gulab Jamun', price: 100, qty: 8 }] },
  ];
  for (const o of orderData) {
    const existing = await prisma.order.findFirst({ where: { tableNumber: o.tableNumber, status: o.status } });
    if (!existing) {
      await prisma.order.create({
        data: {
          tableNumber: o.tableNumber,
          status: o.status,
          guestCount: o.guestCount,
          estimatedWait: 15,
          items: { create: o.items.map(i => ({ name: i.name, price: i.price, qty: i.qty })) },
        },
      });
    }
  }
  console.log('  ✓ ' + orderData.length + ' orders created');

  // ── PAYMENTS (for Completed orders) ──────────────────────────
  console.log('💳 Creating payments...');
  const completedOrders = await prisma.order.findMany({
    where: { status: 'Completed', payment: null },
    include: { items: true },
    take: 15,
  });
  const payMethods = ['Cash', 'Card', 'eSewa', 'Khalti', 'Cash'];
  let pmCount = 0;
  for (const order of completedOrders) {
    const total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    if (total > 0) {
      await prisma.payment.create({
        data: {
          orderId: order.id, method: payMethods[pmCount % payMethods.length],
          amount: total, amountPaid: total, change: 0,
          receiptNo: 'REC' + String(order.id).padStart(4,'0'), status: 'Paid',
        },
      });
      pmCount++;
    }
  }
  console.log('  ✓ ' + pmCount + ' payments created');

  // ── RESERVATIONS ──────────────────────────────────────────────
  console.log('📅 Creating reservations...');
  const fmt = (d) => d.toISOString().slice(0,10);
  const d0 = new Date(today); const d1 = new Date(today); d1.setDate(d1.getDate()+1);
  const d2 = new Date(today); d2.setDate(d2.getDate()+2);
  const d3 = new Date(today); d3.setDate(d3.getDate()+3);
  const reservations = [
    { name: 'Anita Tamang',   phone: '9811111111', guests: 4, date: fmt(d0), time: '12:30', tableNo: 3,  status: 'Confirmed' },
    { name: 'Bikram Rai',     phone: '9822222222', guests: 2, date: fmt(d0), time: '19:00', tableNo: 5,  status: 'Confirmed' },
    { name: 'Eshan Magar',    phone: '9855555555', guests: 6, date: fmt(d1), time: '13:00', tableNo: 4,  status: 'Confirmed' },
    { name: 'Fiona Sherpa',   phone: '9866666666', guests: 3, date: fmt(d1), time: '20:00', tableNo: 7,  status: 'Confirmed' },
    { name: 'Hira Pun',       phone: '9888888888', guests: 8, date: fmt(d2), time: '18:30', tableNo: 8,  status: 'Pending' },
    { name: 'Indira KC',      phone: '9899999999', guests: 2, date: fmt(d2), time: '12:00', tableNo: 1,  status: 'Confirmed' },
    { name: 'Jeevan Bogati',  phone: '9800000001', guests: 5, date: fmt(d3), time: '19:30', tableNo: 12, status: 'Pending' },
    { name: 'Lalit Bhandari', phone: '9800000003', guests: 10,date: fmt(d3), time: '13:00', tableNo: 15, status: 'Confirmed' },
  ];
  for (const r of reservations) {
    const existing = await prisma.reservation.findFirst({ where: { phone: r.phone, date: r.date } });
    if (!existing) await prisma.reservation.create({ data: r });
  }
  console.log('  ✓ ' + reservations.length + ' reservations created');

  // ── COUPONS ───────────────────────────────────────────────────
  console.log('🎟️  Creating coupons...');
  const coupons = [
    { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 300, description: 'Welcome 10% off for new customers', active: true },
    { code: 'LUNCH20',   type: 'percent', value: 20, minOrder: 200, description: 'Lunch special 20% off (12-3pm)',    active: true },
    { code: 'FLAT50',    type: 'fixed',   value: 50, minOrder: 400, description: 'Flat Rs 50 off on orders above 400',active: true },
    { code: 'VIP100',    type: 'fixed',   value: 100,minOrder: 500, description: 'VIP customer Rs 100 off',           active: true },
    { code: 'SUMMER15',  type: 'percent', value: 15, minOrder: 250, description: 'Summer season discount',            active: false },
    { code: 'BDAY30',    type: 'percent', value: 30, minOrder: 100, description: '30% off on birthday visit',         active: true },
  ];
  for (const c of coupons) {
    const existing = await prisma.coupon.findFirst({ where: { code: c.code } });
    if (!existing) await prisma.coupon.create({ data: c });
  }
  console.log('  ✓ ' + coupons.length + ' coupons created');

  // ── EXPENSES ──────────────────────────────────────────────────
  console.log('💸 Creating expenses...');
  const expDates = Array.from({length:10},(_,i)=>{ const d=new Date(today); d.setDate(d.getDate()-i); return d.toISOString().slice(0,10); });
  const expenses = [
    { category: 'Rent',      description: 'Monthly rent June 2026',          amount: 45000, date: expDates[0], paymentMode: 'Bank' },
    { category: 'Utilities', description: 'Electricity bill',                 amount: 8500,  date: expDates[1], paymentMode: 'Bank' },
    { category: 'Utilities', description: 'Water and waste disposal',         amount: 2200,  date: expDates[2], paymentMode: 'Cash' },
    { category: 'Supplies',  description: 'Cleaning and hygiene supplies',    amount: 3800,  date: expDates[3], paymentMode: 'Cash' },
    { category: 'Supplies',  description: 'Packaging and takeaway containers',amount: 1900,  date: expDates[4], paymentMode: 'Cash' },
    { category: 'Staff',     description: 'Advance salary for Hari Prasad',  amount: 5000,  date: expDates[5], paymentMode: 'Cash' },
    { category: 'Marketing', description: 'Social media promotion May',       amount: 3000,  date: expDates[6], paymentMode: 'Card' },
    { category: 'Other',     description: 'Equipment repair grinder',         amount: 2500,  date: expDates[7], paymentMode: 'Cash' },
    { category: 'Supplies',  description: 'Crockery and cutlery replacement', amount: 4200,  date: expDates[8], paymentMode: 'Card' },
    { category: 'Utilities', description: 'Internet and phone bill',          amount: 1800,  date: expDates[9], paymentMode: 'Bank' },
  ];
  for (const e of expenses) {
    const existing = await prisma.expense.findFirst({ where: { description: e.description } });
    if (!existing) await prisma.expense.create({ data: { ...e, createdBy: 'admin' } });
  }
  console.log('  ✓ ' + expenses.length + ' expenses created');

  // ── GIFT CARDS ────────────────────────────────────────────────
  console.log('🎁 Creating gift cards...');
  const giftCards = [
    { code: 'GIFT-UENA-001', initialValue: 500,  balance: 500,  status: 'ACTIVE',   recipientName: 'Anita Tamang',   purchasedBy: 'Walk-in Customer' },
    { code: 'GIFT-UENA-002', initialValue: 1000, balance: 350,  status: 'ACTIVE',   recipientName: 'Bikram Rai',     purchasedBy: 'Hira Pun' },
    { code: 'GIFT-UENA-003', initialValue: 2000, balance: 0,    status: 'REDEEMED', recipientName: 'Indira KC',      purchasedBy: 'Corporate Client' },
    { code: 'GIFT-UENA-004', initialValue: 500,  balance: 500,  status: 'ACTIVE',   recipientName: 'Lalit Bhandari', purchasedBy: 'Walk-in Customer' },
    { code: 'GIFT-UENA-005', initialValue: 1500, balance: 1500, status: 'ACTIVE',   recipientName: 'Deepika Limbu',  purchasedBy: 'Eshan Magar' },
  ];
  for (const gc of giftCards) {
    const existing = await prisma.giftCard.findFirst({ where: { code: gc.code } });
    if (!existing) await prisma.giftCard.create({ data: gc });
  }
  console.log('  ✓ ' + giftCards.length + ' gift cards created');

  // ── TRAINING MODULES ─────────────────────────────────────────
  console.log('🎓 Creating training modules...');
  const trainingModules = [
    { title: 'Food Safety and Hygiene Basics', category: 'HYGIENE', description: 'Hand washing, food storage, cross-contamination', durationMin: 45, mandatory: true },
    { title: 'Customer Service Excellence',    category: 'SERVICE', description: 'Greeting, taking orders, handling complaints',     durationMin: 60, mandatory: true },
    { title: 'Fire Safety and Emergency Exits',category: 'SAFETY',  description: 'Fire extinguisher use, evacuation procedures',    durationMin: 30, mandatory: true },
    { title: 'POS System Training',            category: 'GENERAL', description: 'Using the restaurant system, billing, refunds',    durationMin: 90, mandatory: true },
    { title: 'Kitchen Knife Skills',           category: 'KITCHEN', description: 'Safe knife handling and basic cutting techniques', durationMin: 60, mandatory: false },
    { title: 'Upselling and Menu Knowledge',   category: 'SERVICE', description: 'Menu items, pairings, recommended combos',         durationMin: 45, mandatory: false },
  ];
  for (const tm of trainingModules) {
    const existing = await prisma.trainingModule.findFirst({ where: { title: tm.title } });
    if (!existing) await prisma.trainingModule.create({ data: tm });
  }
  console.log('  ✓ ' + trainingModules.length + ' training modules created');

  // ── MARKETING CAMPAIGNS ───────────────────────────────────────
  console.log('📢 Creating campaigns...');
  const campaigns = [
    { name: 'Monsoon Special Offer',   channel: 'SMS',   message: 'Enjoy 20% off all hot beverages this monsoon! Visit Uena Restaurant today.', targetGroup: 'ALL',     status: 'SENT',      sentCount: 248 },
    { name: 'VIP Appreciation Week',   channel: 'EMAIL', message: 'Dear valued guest, enjoy exclusive VIP discounts all week!',                  targetGroup: 'VIP',     status: 'SENT',      sentCount: 42 },
    { name: 'Birthday Month Campaign', channel: 'SMS',   message: 'Happy Birthday! Come celebrate with us 30% off your entire meal this month!', targetGroup: 'LOYALTY', status: 'SCHEDULED', sentCount: 0 },
    { name: 'Lunch Special Promotion', channel: 'BOTH',  message: 'Lunchtime deals 12-3pm daily. Order any main course get a free drink!',       targetGroup: 'ALL',     status: 'SENT',      sentCount: 385 },
  ];
  for (const c of campaigns) {
    const existing = await prisma.marketingCampaign.findFirst({ where: { name: c.name } });
    if (!existing) await prisma.marketingCampaign.create({ data: c });
  }
  console.log('  ✓ ' + campaigns.length + ' campaigns created');

  // ── PROMOTIONS ────────────────────────────────────────────────
  console.log('🎯 Creating promotions...');
  const promotions = [
    { name: 'Happy Hour',        description: 'All drinks 25% off between 4-6 PM',              type: 'happyhour', discountPct: 25, startTime: '16:00', endTime: '18:00', days: 'Mon,Tue,Wed,Thu,Fri', active: true,  applyTo: 'category', applyValue: 'Drinks' },
    { name: 'Lunch Combo Deal',  description: 'Main course + drink + dessert flat Rs 350',       type: 'combo',     discountAmt: 80, startTime: '12:00', endTime: '15:00', days: 'Mon,Tue,Wed,Thu,Fri', active: true,  applyTo: 'all' },
    { name: 'Weekend BOGO Momo', description: 'Buy 1 plate Momo get 1 free on weekends',         type: 'bogo',      discountPct: 50, days: 'Sat,Sun',    active: true,  applyTo: 'item', applyValue: 'Chicken Momo' },
    { name: 'Festival Sale',     description: '15% off entire menu during festival week',         type: 'seasonal',  discountPct: 15, startDate: '2026-10-20', endDate: '2026-10-27', active: false, applyTo: 'all' },
  ];
  for (const p of promotions) {
    const existing = await prisma.promotion.findFirst({ where: { name: p.name } });
    if (!existing) await prisma.promotion.create({ data: p });
  }
  console.log('  ✓ ' + promotions.length + ' promotions created');

  // ── WAITLIST ──────────────────────────────────────────────────
  console.log('⏳ Creating waitlist entries...');
  const waitlist = [
    { customerName: 'Mohan Darlami', phone: '9841234567', partySize: 3, preference: 'window', estimatedWait: 20, status: 'WAITING' },
    { customerName: 'Sunita Ale',    phone: '9852345678', partySize: 2, preference: '',        estimatedWait: 10, status: 'NOTIFIED' },
    { customerName: 'Rajan Khanal', phone: '9863456789', partySize: 5, preference: 'quiet',   estimatedWait: 30, status: 'WAITING' },
    { customerName: 'Priya Singh',  phone: '9874567890', partySize: 2, preference: '',         estimatedWait: 5,  status: 'SEATED' },
  ];
  for (const w of waitlist) {
    const existing = await prisma.waitlistEntry.findFirst({ where: { phone: w.phone } });
    if (!existing) await prisma.waitlistEntry.create({ data: w });
  }
  console.log('  ✓ ' + waitlist.length + ' waitlist entries created');

  // ── FEEDBACK ──────────────────────────────────────────────────
  console.log('💬 Creating feedback entries...');
  const feedbacks = [
    { customerName: 'Anita Tamang',  tableNo: 3,  foodRating: 5, serviceRating: 5, ambienceRating: 4, overallRating: 5, comment: 'Absolutely loved the Dal Bhat! The chicken curry was perfect. Will definitely come back.', status: 'REVIEWED' },
    { customerName: 'Bikram Rai',    tableNo: 5,  foodRating: 4, serviceRating: 4, ambienceRating: 4, overallRating: 4, comment: 'Great food and quick service. The burger was juicy. Slightly noisy on the weekend.', status: 'REVIEWED' },
    { customerName: 'Anonymous',     tableNo: 8,  foodRating: 5, serviceRating: 3, ambienceRating: 4, overallRating: 4, comment: 'Food was excellent but waited a bit long for service. The momo was the best I have had!', status: 'NEW' },
    { customerName: 'Eshan Magar',   tableNo: 4,  foodRating: 5, serviceRating: 5, ambienceRating: 5, overallRating: 5, comment: 'Perfect experience from start to finish. Staff were very friendly and attentive.', status: 'RESPONDED', response: 'Thank you so much! We look forward to seeing you again soon!', respondedBy: 'manager1' },
    { customerName: 'Hira Pun',      tableNo: 2,  foodRating: 4, serviceRating: 5, ambienceRating: 4, overallRating: 4, comment: 'Consistently great quality. Uena is our go-to restaurant for family dinners.', status: 'REVIEWED' },
    { customerName: 'Anonymous',     tableNo: 10, foodRating: 3, serviceRating: 4, ambienceRating: 3, overallRating: 3, comment: 'Average experience this time. The thukpa was a bit bland compared to last visit.', status: 'NEW' },
  ];
  for (const f of feedbacks) {
    const existing = await prisma.feedbackEntry.findFirst({ where: { comment: f.comment } });
    if (!existing) await prisma.feedbackEntry.create({ data: f });
  }
  console.log('  ✓ ' + feedbacks.length + ' feedback entries created');

  // ── VENDOR INVOICES ───────────────────────────────────────────
  console.log('🧾 Creating vendor invoices...');
  const invoices = [
    { supplierName: 'Annapurna Traders',      invoiceNo: 'INV-AT-001', total: 8500,  subtotal: 8500,  amountPaid: 8500,  status: 'PAID',   notes: 'Rice and flour delivery' },
    { supplierName: 'Valley Fresh Meats',     invoiceNo: 'INV-VF-001', total: 12400, subtotal: 12400, amountPaid: 6000,  status: 'PARTIAL',notes: 'Weekly meat supply' },
    { supplierName: 'Himalayan Dairy',        invoiceNo: 'INV-HD-001', total: 4200,  subtotal: 4200,  amountPaid: 0,     status: 'UNPAID', notes: 'Dairy products June week 1' },
    { supplierName: 'Capital Spice House',    invoiceNo: 'INV-CS-001', total: 3100,  subtotal: 3100,  amountPaid: 3100,  status: 'PAID',   notes: 'Masala and spice restock' },
    { supplierName: 'Bhat-Bhateni Wholesale', invoiceNo: 'INV-BB-001', total: 6800,  subtotal: 6800,  amountPaid: 0,     status: 'OVERDUE',notes: 'General supplies May' },
  ];
  for (const inv of invoices) {
    const existing = await prisma.vendorInvoice.findFirst({ where: { invoiceNo: inv.invoiceNo } });
    if (!existing) await prisma.vendorInvoice.create({ data: inv });
  }
  console.log('  ✓ ' + invoices.length + ' vendor invoices created');

  // ── PURCHASE ORDERS ───────────────────────────────────────────
  console.log('📋 Creating purchase orders...');
  const purchaseOrders = [
    { poNumber: 'PO-2026-001', supplierName: 'Annapurna Traders',     total: 7500,  subtotal: 7500,  status: 'RECEIVED', notes: 'Monthly grain order' },
    { poNumber: 'PO-2026-002', supplierName: 'Valley Fresh Meats',    total: 15000, subtotal: 15000, status: 'SENT',     notes: 'Weekly meat supply' },
    { poNumber: 'PO-2026-003', supplierName: 'Himalayan Dairy',       total: 4800,  subtotal: 4800,  status: 'DRAFT',    notes: 'Dairy restock' },
    { poNumber: 'PO-2026-004', supplierName: 'Capital Spice House',   total: 3200,  subtotal: 3200,  status: 'RECEIVED', notes: 'Masala stock' },
  ];
  for (const po of purchaseOrders) {
    const existing = await prisma.purchaseOrder.findFirst({ where: { poNumber: po.poNumber } });
    if (!existing) await prisma.purchaseOrder.create({ data: po });
  }
  console.log('  ✓ ' + purchaseOrders.length + ' purchase orders created');

  // ── SETTINGS ─────────────────────────────────────────────────
  console.log('⚙️  Creating default settings...');
  const settings = [
    { key: 'restaurant_name', value: 'Uena Restaurant' },
    { key: 'currency',        value: 'Rs' },
    { key: 'daily_target',    value: '25000' },
    { key: 'tax_rate',        value: '13' },
    { key: 'service_charge',  value: '10' },
    { key: 'receipt_footer',  value: 'Thank you for dining at Uena Restaurant! See you again.' },
    { key: 'loyalty_rate',    value: '1' },
    { key: 'table_turn_time', value: '60' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log('  ✓ ' + settings.length + ' settings created');

  console.log('\n✅ Seed complete! Uena Restaurant is ready to demo.\n');
  console.log('  Credentials:');
  console.log('  admin / restaurant123');
  console.log('  manager1 / manager123');
  console.log('  chef1 / chef123');
  console.log('  waiter1 / staff123');
  console.log('  cashier1 / staff123\n');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
