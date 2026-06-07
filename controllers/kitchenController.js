// controllers/kitchenController.js
const prisma  = require('../config/prisma');
const notify  = require('../services/notificationService');

exports.getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['Pending', 'Preparing'] } },
      include: { items: true }, orderBy: { createdAt: 'asc' },
    });
    res.json(orders.map(o => ({
      id: o.id, table: o.tableNumber, status: o.status,
      estimatedWait: o.estimatedWait, guests: o.guestCount,
      notes: o.notes, time: o.createdAt,
      items: o.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
    })));
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const data = { status };
    if (status === 'Completed') data.completedAt = new Date();
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) }, data, include: { items: true },
    });
    const shaped = { id: order.id, table: order.tableNumber, status: order.status, time: order.createdAt, items: order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })) };
    notify.notifyOrderUpdate(shaped);
    res.json({ success: true, order: shaped });
  } catch (e) { res.status(404).json({ success: false, message: 'Order not found' }); }
};

exports.getStats = async (req, res) => {
  try {
    const [pending, preparing, completed] = await Promise.all([
      prisma.order.count({ where: { status: 'Pending' } }),
      prisma.order.count({ where: { status: 'Preparing' } }),
      prisma.order.count({ where: { status: 'Completed' } }),
    ]);
    res.json({ pending, preparing, completed });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
