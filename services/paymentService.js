// services/paymentService.js — Prisma-based
const prisma = require('../config/prisma');
const { generateReceiptNo } = require('../utils/helpers');
const { generateReceiptHTML } = require('../utils/receiptGenerator');

async function processPayment({ orderId, method, amountPaid, amount: overrideAmount }) {
  const order = await prisma.order.findUnique({ where: { id: parseInt(orderId) }, include: { items: true } });
  if (!order) throw new Error('Order not found');

  const baseAmount = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const amount     = overrideAmount ? Math.round(parseFloat(overrideAmount)) : baseAmount;
  const change     = Math.round(parseFloat(amountPaid)) - amount;
  const receiptNo  = generateReceiptNo();

  const payment = await prisma.payment.create({
    data: { orderId: parseInt(orderId), method, amount, amountPaid: Math.round(parseFloat(amountPaid)), change: Math.max(0, change), receiptNo, status: 'Paid' },
  });

  await prisma.order.update({ where: { id: parseInt(orderId) }, data: { status: 'Completed', completedAt: new Date() } });

  const shaped = { id: order.id, table: order.tableNumber, items: order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })), time: order.createdAt };
  const receiptHtml = generateReceiptHTML(shaped, payment);
  return { payment, order: shaped, receiptHtml, change: Math.max(0, change) };
}

async function getPaymentSummary() {
  const payments = await prisma.payment.findMany();
  const total    = payments.reduce((s, p) => s + p.amount, 0);
  const byMethod = payments.reduce((acc, p) => { acc[p.method] = (acc[p.method]||0) + p.amount; return acc; }, {});
  return { total, count: payments.length, byMethod };
}

module.exports = { processPayment, getPaymentSummary };
