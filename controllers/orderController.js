// controllers/orderController.js
const prisma  = require('../config/prisma');
const notify  = require('../services/notificationService');

function shapeOrder(o) {
  return {
    id:            o.id,
    table:         o.tableNumber,
    tableId:       o.tableId,
    status:        o.status,
    estimatedWait: o.estimatedWait,
    guests:        o.guestCount,
    notes:         o.notes,
    time:          o.createdAt,
    completedAt:   o.completedAt,
    items:         (o.items || []).map(i => ({ name: i.name, qty: i.qty, price: i.price })),
  };
}

exports.shapeOrder = shapeOrder;

exports.getAll = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'asc' } });
    res.json(orders.map(shapeOrder));
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  const orders = await prisma.order.findMany({ include: { items: true } });
  res.json({ totalOrders: orders.length });
};

exports.getByTable = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { tableNumber: parseInt(req.params.t) },
    include: { items: true }, orderBy: { createdAt: 'desc' },
  });
  res.json(orders.map(shapeOrder));
};

exports.getById = async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: parseInt(req.params.id) }, include: { items: true } });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json(shapeOrder(order));
};

exports.create = async (req, res) => {
  try {
    const { table, items, guests, notes } = req.body;
    if (!table || !items?.length)
      return res.status(400).json({ success: false, message: 'Table and items required' });

    const menuItems = await prisma.menuItem.findMany({ where: { name: { in: items.map(i => i.name) } } });
    const estimatedWait = items.reduce((max, i) => {
      const m = menuItems.find(m => m.name === i.name);
      return Math.max(max, m?.waitMins || 10);
    }, 0);

    const tableRec = await prisma.restaurantTable.findUnique({ where: { number: parseInt(table) } });
    const order = await prisma.order.create({
      data: {
        tableNumber:   parseInt(table),
        tableId:       tableRec?.id || null,
        guestCount:    parseInt(guests) || 1,
        notes:         notes || '',
        estimatedWait,
        items: { create: items.map(i => ({ name: i.name, qty: parseInt(i.qty), price: parseInt(i.price) || 0, menuId: menuItems.find(m => m.name === i.name)?.id || null })) },
      },
      include: { items: true },
    });
    const shaped = shapeOrder(order);
    notify.notifyNewOrder(shaped);
    res.json({ success: true, order: shaped });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const data = { status: req.body.status };
    if (req.body.status === 'Completed') data.completedAt = new Date();
    const order = await prisma.order.update({ where: { id: parseInt(req.params.id) }, data, include: { items: true } });
    const shaped = shapeOrder(order);
    notify.notifyOrderUpdate(shaped);
    res.json({ success: true, order: shaped });
  } catch (e) { res.status(404).json({ success: false, message: 'Order not found' }); }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { items, table, status } = req.body;
    const data = {};
    if (status) { data.status = status; if (status === 'Completed') data.completedAt = new Date(); }
    if (table)  data.tableNumber = parseInt(table);
    if (items?.length) {
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      data.items = { create: items.map(i => ({ name: i.name, qty: parseInt(i.qty), price: parseInt(i.price) || 0 })) };
    }
    const order = await prisma.order.update({ where: { id }, data, include: { items: true } });
    const shaped = shapeOrder(order);
    notify.notifyOrderUpdate(shaped);
    res.json({ success: true, order: shaped });
  } catch (e) { res.status(404).json({ success: false, message: 'Order not found' }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(404).json({ success: false, message: 'Order not found' }); }
};

exports.callBell = (req, res) => {
  const { table, message } = req.body;
  notify.notifyBell(table, message || 'Call bell');
  res.json({ success: true });
};
