// services/stripeService.js
// Stripe integration — env ma STRIPE_SECRET_KEY set garnus
// npm install stripe

let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch { /* stripe not installed */ }

async function createPaymentIntent(amount, currency = 'npr') {
  if (!stripe) throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY in .env');
  const intent = await stripe.paymentIntents.create({ amount: amount * 100, currency });
  return { clientSecret: intent.client_secret, intentId: intent.id };
}

async function confirmPayment(intentId) {
  if (!stripe) throw new Error('Stripe not configured');
  const intent = await stripe.paymentIntents.retrieve(intentId);
  return { status: intent.status, amount: intent.amount / 100 };
}

module.exports = { createPaymentIntent, confirmPayment };
