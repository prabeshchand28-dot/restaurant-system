// services/paymentService.js
const db = require('../config/database');
const { calcOrderTotal, generateReceiptNo } = require('../utils/helpers');
const { generateReceiptHTML } = require('../utils/receiptGenerator');

function processPayment({ orderId, method, amountPaid }) {
  const order = db.getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  const amount   = calcOrderTotal(order.items);
  const change   = amountPaid - amount;
  const receiptNo = generateReceiptNo();

  const payment = db.addPayment({
    orderId, method, amount, amountPaid, change, receiptNo,
    status: 'Paid'
  });

  // Mark order as completed
  db.updateOrderStatus(orderId, 'Completed');

  const receiptHtml = generateReceiptHTML(order, payment);

  return { payment, order, receiptHtml, change };
}

function getPaymentSummary() {
  const payments = db.getPayments();
  const total    = payments.reduce((s, p) => s + p.amount, 0);
  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {});
  return { total, count: payments.length, byMethod };
}

module.exports = { processPayment, getPaymentSummary };