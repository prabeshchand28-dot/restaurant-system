const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get gateway settings (admin)
exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.paymentGatewaySetting.findMany();
    // Mask secret keys
    res.json(settings.map(s => ({ ...s, secretKey: s.secretKey ? '••••••••' + s.secretKey.slice(-4) : '', webhookSecret: s.webhookSecret ? '••••' : '' })));
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.saveSettings = async (req, res) => {
  try {
    const { gateway, enabled, publicKey, secretKey, webhookSecret, testMode } = req.body;
    if (!gateway) return res.status(400).json({ message: 'gateway required' });
    const setting = await prisma.paymentGatewaySetting.upsert({
      where: { gateway },
      create: { gateway, enabled: !!enabled, publicKey: publicKey || '', secretKey: secretKey || '', webhookSecret: webhookSecret || '', testMode: testMode !== false },
      update: {
        enabled: !!enabled,
        publicKey: publicKey || undefined,
        secretKey: secretKey && !secretKey.includes('••') ? secretKey : undefined,
        webhookSecret: webhookSecret && !webhookSecret.includes('••') ? webhookSecret : undefined,
        testMode: testMode !== false
      }
    });
    res.json({ success: true, setting: { ...setting, secretKey: '••••••••' + (setting.secretKey || '').slice(-4) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Create a Stripe checkout session (requires Stripe SDK + real keys)
exports.createSession = async (req, res) => {
  try {
    const setting = await prisma.paymentGatewaySetting.findUnique({ where: { gateway: 'STRIPE' } });
    if (!setting?.enabled || !setting?.secretKey) {
      return res.status(400).json({ message: 'Stripe is not configured. Add your API keys in Payment Settings.' });
    }

    // Try to load Stripe dynamically
    let stripe;
    try {
      const Stripe = require('stripe');
      stripe = Stripe(setting.secretKey);
    } catch {
      return res.status(500).json({ message: 'Stripe SDK not installed. Run: npm install stripe' });
    }

    const { orderId, amount, currency = 'npr', customerEmail, description } = req.body;
    if (!amount) return res.status(400).json({ message: 'amount required' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          product_data: { name: description || `Order #${orderId}` },
          unit_amount: Math.round(amount * 100), // stripe uses smallest unit
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      success_url: `${req.headers.origin || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${req.headers.origin || 'http://localhost:3000'}/payment-cancel`,
      metadata: { orderId: String(orderId || '') },
    });

    // Update online order payment status
    if (orderId) {
      await prisma.onlineOrder.update({ where: { id: +orderId }, data: { stripePaymentId: session.id, paymentStatus: 'PENDING' } }).catch(() => {});
    }

    res.json({ url: session.url, sessionId: session.id });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Stripe webhook
exports.webhook = async (req, res) => {
  try {
    const setting = await prisma.paymentGatewaySetting.findUnique({ where: { gateway: 'STRIPE' } });
    if (!setting?.secretKey) return res.status(400).json({ message: 'Stripe not configured' });

    let stripe, event;
    try {
      stripe = require('stripe')(setting.secretKey);
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], setting.webhookSecret);
    } catch (err) {
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.onlineOrder.update({ where: { id: +orderId }, data: { paymentStatus: 'PAID', status: 'CONFIRMED' } }).catch(() => {});
      }
    }
    res.json({ received: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// eSewa simulate (Nepal payment gateway)
exports.esewaInitiate = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    // eSewa integration — returns form data to POST to eSewa
    const merchantCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
    const esewaUrl = process.env.ESEWA_TEST ? 'https://uat.esewa.com.np/epay/main' : 'https://esewa.com.np/epay/main';
    res.json({
      url: esewaUrl,
      params: {
        amt: amount,
        pdc: 0, psc: 0, txAmt: 0,
        tAmt: amount,
        pid: `ORDER-${orderId}-${Date.now()}`,
        scd: merchantCode,
        su: `${req.headers.origin}/payment-success`,
        fu: `${req.headers.origin}/payment-cancel`,
      },
      note: 'POST these params as a form to the eSewa URL'
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
