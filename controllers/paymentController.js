// controllers/paymentController.js
const prisma  = require('../config/prisma');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { generateReceiptNo } = require('../utils/helpers');
const { generateReceiptHTML } = require('../utils/receiptGenerator');

exports.getAll = async (req, res) => {
  const payments = await prisma.payment.findMany({
    include: { order: { include: { items: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(payments);
};

exports.getSummary = async (req, res) => {
  const payments = await prisma.payment.findMany();
  const total    = payments.reduce((s, p) => s + p.amount, 0);
  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {});
  res.json({ total, count: payments.length, byMethod });
};

exports.process = async (req, res) => {
  try {
    const { orderId, method, amountPaid } = req.body;
    if (!orderId || !method || !amountPaid)
      return res.status(400).json({ success: false, message: 'orderId, method, amountPaid required' });

    const order = await prisma.order.findUnique({ where: { id: parseInt(orderId) }, include: { items: true } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const baseAmount = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    const amount     = req.body.amount ? Math.round(parseFloat(req.body.amount)) : baseAmount;
    const change     = Math.round(parseFloat(amountPaid)) - amount;
    const receiptNo  = generateReceiptNo();

    const payment = await prisma.payment.create({
      data: {
        orderId:    parseInt(orderId),
        method,
        amount,
        amountPaid: Math.round(parseFloat(amountPaid)),
        change:     Math.max(0, change),
        receiptNo,
        status:     'Paid',
      },
    });

    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data:  { status: 'Completed', completedAt: new Date() },
    });

    const shaped = {
      id: order.id, table: order.tableNumber, status: order.status,
      items: order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      time: order.createdAt,
    };
    const receiptHtml = generateReceiptHTML(shaped, payment);
    res.json({ success: true, payment, order: shaped, receiptHtml, change: Math.max(0, change) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
