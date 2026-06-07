// services/paypayService.js
// PayPay integration — env ma PAYPAY_API_KEY set garnus

async function createPayment(amount, orderId) {
  if (!process.env.PAYPAY_API_KEY) throw new Error('PayPay not configured. Set PAYPAY_API_KEY in .env');
  throw new Error('PayPay integration not yet active. Contact developer.');
}

module.exports = { createPayment };
