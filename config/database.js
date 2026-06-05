// config/database.js
const fs   = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '../database/restaurant.db.json');

const DEFAULT_DATA = {
  menu: [
    { id:1, name:'Momo',        price:150, category:'Snacks',  image:null, available:true, featured:false, allergens:[], waitMins:10, discount:0 },
    { id:2, name:'Chowmein',    price:180, category:'Noodles', image:null, available:true, featured:true,  allergens:['Gluten'], waitMins:12, discount:0 },
    { id:3, name:'Thukpa',      price:200, category:'Noodles', image:null, available:true, featured:false, allergens:[], waitMins:15, discount:0 },
    { id:4, name:'Burger',      price:220, category:'Snacks',  image:null, available:true, featured:true,  allergens:['Gluten','Dairy'], waitMins:8, discount:10 },
    { id:5, name:'Pizza',       price:350, category:'Main',    image:null, available:true, featured:false, allergens:['Gluten','Dairy'], waitMins:20, discount:0 },
    { id:6, name:'Dal Bhat',    price:250, category:'Main',    image:null, available:true, featured:true,  allergens:[], waitMins:15, discount:0 },
    { id:7, name:'Lassi',       price:100, category:'Drinks',  image:null, available:true, featured:false, allergens:['Dairy'], waitMins:3, discount:20 },
    { id:8, name:'Masala Chai', price:60,  category:'Drinks',  image:null, available:true, featured:false, allergens:['Dairy'], waitMins:5, discount:0 },
  ],
  orders:       [],
  guests:       [],
  payments:     [],
  ratings:      [],
  reservations: [],
  inventory:    [
    { id:1, name:'Rice',    quantity:50, unit:'kg',  minStock:10, category:'Grains' },
    { id:2, name:'Flour',   quantity:20, unit:'kg',  minStock:5,  category:'Grains' },
    { id:3, name:'Oil',     quantity:10, unit:'L',   minStock:3,  category:'Cooking' },
    { id:4, name:'Chicken', quantity:8,  unit:'kg',  minStock:5,  category:'Protein' },
    { id:5, name:'Milk',    quantity:15, unit:'L',   minStock:5,  category:'Dairy' },
    { id:6, name:'Tea',     quantity:2,  unit:'kg',  minStock:1,  category:'Beverages' },
  ],
  tables: [1,2,3,4,5,6,7,8,9,10],
  users: [
    { id:1, username:'admin',   password:'restaurant123', role:'admin',   name:'Admin',      email:'admin@restaurant.com', phone:'9800000000', active:true, createdAt:new Date().toISOString() },
    { id:2, username:'waiter1', password:'staff123',      role:'waiter',  name:'Waiter One', email:'', phone:'', active:true, createdAt:new Date().toISOString() },
  ],
  nextIds: { menu:9, order:1, payment:1, rating:1, reservation:1, inventory:7, user:3 }
};

class Database {
  constructor() { this._ensure(); this.data = this._load(); }
  _ensure() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive:true });
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
  _load() { try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return { ...DEFAULT_DATA }; } }
  save()  { fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2)); }

  // ── Menu ──
  getMenu()        { return this.data.menu; }
  getMenuById(id)  { return this.data.menu.find(m => m.id === id); }
  addMenuItem(item) {
    item.id = this.data.nextIds.menu++;
    if (!item.allergens) item.allergens = [];
    if (!item.waitMins)  item.waitMins  = 10;
    if (item.featured  === undefined) item.featured  = false;
    if (item.discount  === undefined) item.discount  = 0;
    this.data.menu.push(item); this.save(); return item;
  }
  updateMenuItem(id, data) {
    const item = this.getMenuById(id);
    if (!item) return null;
    Object.assign(item, data); this.save(); return item;
  }
  deleteMenuItem(id) {
    const i = this.data.menu.findIndex(m => m.id === id);
    if (i === -1) return false;
    this.data.menu.splice(i, 1); this.save(); return true;
  }

  // ── Orders ──
  getOrders()         { return this.data.orders; }
  getOrderById(id)    { return this.data.orders.find(o => o.id === id); }
  getOrdersByTable(t) { return this.data.orders.filter(o => o.table === t); }
  addOrder(order) {
    order.id     = this.data.nextIds.order++;
    order.time   = new Date().toISOString();
    order.status = 'Pending';
    const menu   = this.data.menu;
    order.estimatedWait = order.items.reduce((max, i) => {
      const item = menu.find(m => m.name === i.name);
      return Math.max(max, item ? item.waitMins || 10 : 10);
    }, 0);
    this.data.orders.push(order); this.save(); return order;
  }
  updateOrderStatus(id, status) {
    const order = this.getOrderById(id);
    if (!order) return null;
    order.status = status;
    if (status === 'Completed') order.completedAt = new Date().toISOString();
    this.save(); return order;
  }
  deleteOrder(id) {
    const i = this.data.orders.findIndex(o => o.id === id);
    if (i === -1) return false;
    this.data.orders.splice(i, 1); this.save(); return true;
  }

  // ── Guests ──
  getGuests()        { return this.data.guests; }
  upsertGuest(guest) {
    this.data.guests = this.data.guests.filter(g => g.table !== guest.table);
    guest.time = guest.time || new Date().toISOString();
    this.data.guests.push(guest); this.save(); return guest;
  }

  // ── Payments ──
  getPayments()       { return this.data.payments; }
  getPaymentById(id)  { return this.data.payments.find(p => p.id === id); }
  addPayment(payment) {
    payment.id   = this.data.nextIds.payment++;
    payment.time = new Date().toISOString();
    this.data.payments.push(payment); this.save(); return payment;
  }

  // ── Ratings ──
  getRatings()      { return this.data.ratings; }
  addRating(rating) {
    rating.id = this.data.nextIds.rating++; rating.time = new Date().toISOString();
    this.data.ratings.push(rating); this.save(); return rating;
  }

  // ── Reservations ──
  getReservations()           { return this.data.reservations || []; }
  getReservationById(id)      { return (this.data.reservations||[]).find(r => r.id === id); }
  addReservation(reservation) {
    if (!this.data.reservations) this.data.reservations = [];
    reservation.id        = this.data.nextIds.reservation++;
    reservation.createdAt = new Date().toISOString();
    this.data.reservations.push(reservation); this.save(); return reservation;
  }
  updateReservation(id, data) {
    const r = this.getReservationById(id);
    if (!r) return null;
    Object.assign(r, data); this.save(); return r;
  }
  deleteReservation(id) {
    if (!this.data.reservations) return;
    this.data.reservations = this.data.reservations.filter(r => r.id !== id); this.save();
  }

  // ── Inventory ──
  getInventory()           { return this.data.inventory || []; }
  getInventoryById(id)     { return (this.data.inventory||[]).find(i => i.id === id); }
  addInventoryItem(item) {
    if (!this.data.inventory) this.data.inventory = [];
    item.id = this.data.nextIds.inventory++; this.data.inventory.push(item); this.save(); return item;
  }
  updateInventoryItem(id, data) {
    const item = this.getInventoryById(id);
    if (!item) return null;
    if (data.quantity !== undefined) data.quantity = parseFloat(data.quantity);
    if (data.minStock !== undefined) data.minStock = parseFloat(data.minStock);
    Object.assign(item, data); this.save(); return item;
  }
  deleteInventoryItem(id) {
    if (!this.data.inventory) return;
    this.data.inventory = this.data.inventory.filter(i => i.id !== id); this.save();
  }
  getLowStockItems() {
    return (this.data.inventory||[]).filter(i => i.quantity <= i.minStock);
  }

  // ── Users/Staff ──
  getUsers()          { return this.data.users; }
  getUserById(id)     { return this.data.users.find(u => u.id === id); }
  getUserByUsername(u){ return this.data.users.find(x => x.username === u); }
  addUser(user) {
    if (this.getUserByUsername(user.username)) return null;
    user.id = this.data.nextIds.user++; user.createdAt = new Date().toISOString(); user.active = true;
    this.data.users.push(user); this.save(); return user;
  }
  updateUser(id, data) {
    const user = this.getUserById(id);
    if (!user) return null;
    Object.assign(user, data); this.save(); return user;
  }
  deleteUser(id) {
    if (id === 1) return false;
    const i = this.data.users.findIndex(u => u.id === id);
    if (i === -1) return false;
    this.data.users.splice(i, 1); this.save(); return true;
  }

  // ── Tables ──
  getTables()     { return this.data.tables; }
  addTable(no)    { if (!this.data.tables.includes(no)) { this.data.tables.push(no); this.data.tables.sort((a,b)=>a-b); this.save(); } return this.data.tables; }
  deleteTable(no) { this.data.tables = this.data.tables.filter(t => t !== no); this.save(); return this.data.tables; }

  // ── Stats ──
  getStats() {
    const orders   = this.data.orders;
    const payments = this.data.payments;
    const ratings  = this.data.ratings;
    const today    = new Date().toDateString();
    const todayOrders   = orders.filter(o => new Date(o.time).toDateString() === today);
    const todayRevenue  = payments.filter(p => new Date(p.time).toDateString() === today).reduce((s,p) => s+p.amount, 0);
    const weekRevenue   = payments.filter(p => (Date.now()-new Date(p.time))< 7*86400000).reduce((s,p) => s+p.amount, 0);
    const monthRevenue  = payments.filter(p => (Date.now()-new Date(p.time))<30*86400000).reduce((s,p) => s+p.amount, 0);
    const avgRating     = ratings.length ? (ratings.reduce((s,r) => s+r.overall, 0)/ratings.length).toFixed(1) : '—';
    const lowStock      = this.getLowStockItems().length;
    // Hourly revenue (last 12 hours)
    const hourlyRevenue = {};
    for (let h = 0; h < 12; h++) {
      const hr = new Date(); hr.setHours(hr.getHours()-h, 0, 0, 0);
      const label = hr.getHours() + ':00';
      hourlyRevenue[label] = payments.filter(p => {
        const ph = new Date(p.time); return ph.getHours() === hr.getHours() && ph.toDateString() === hr.toDateString();
      }).reduce((s,p) => s+p.amount, 0);
    }
    // Top items
    const itemCount = {};
    orders.forEach(o => o.items.forEach(i => { itemCount[i.name] = (itemCount[i.name]||0) + i.qty; }));
    const topItems = Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,qty])=>({name,qty}));
    // Peak hours
    const peakHours = {};
    orders.forEach(o => {
      const h = new Date(o.time).getHours() + ':00';
      peakHours[h] = (peakHours[h]||0)+1;
    });
    return {
      totalOrders:orders.length, pendingOrders:orders.filter(o=>o.status==='Pending').length,
      preparingOrders:orders.filter(o=>o.status==='Preparing').length,
      completedOrders:orders.filter(o=>o.status==='Completed').length,
      revenue:payments.reduce((s,p)=>s+p.amount,0), todayRevenue, weekRevenue, monthRevenue,
      totalGuests:this.data.guests.reduce((s,g)=>s+g.count,0),
      avgRating, totalRatings:ratings.length, lowStock, topItems, hourlyRevenue, peakHours,
      todayOrders:todayOrders.length,
      totalReservations:(this.data.reservations||[]).filter(r=>r.date===new Date().toISOString().split('T')[0]).length,
    };
  }
}

module.exports = new Database();