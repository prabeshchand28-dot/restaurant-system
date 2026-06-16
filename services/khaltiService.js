// services/khaltiService.js — Khalti v2 (ePay) Payment Integration

// ── Config ────────────────────────────────────────────────────────────────────
// Test credentials (replace with real keys from khalti.com/business)
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || 'test_secret_key_f59e8b7d18b4499ca40f68195a846e9b';
const KHALTI_BASE_URL   = process.env.NODE_ENV === 'production'
  ? 'https://khalti.com'
  : 'https://a.khalti.com';  // test environment

// ── Initiate Payment ──────────────────────────────────────────────────────────
// Returns { paymentUrl } to redirect customer
async function initiatePayment({ orderId, amount, customerName, customerEmail, customerPhone, returnUrl, websiteUrl }) {
  // Khalti amount is in PAISA (1 Rs = 100 paisa)
  const amountPaisa = Math.round(amount * 100);

  const payload = {
    return_url:    returnUrl,
    website_url:   websiteUrl,
    amount:        amountPaisa,
    purchase_order_id:   `order-${orderId}-${Date.now()}`,
    purchase_order_name: `Table Order #${orderId}`,
    customer_info: {
      name:  customerName  || 'Guest',
      email: customerEmail || 'guest@restaurant.com',
      phone: customerPhone || '9800000000',
    },
  };

  const response = await fetch(`${KHALTI_BASE_URL}/api/v2/epayment/initiate/`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Key ${KHALTI_SECRET_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || JSON.stringify(data));
  }

  return {
    success:    true,
    paymentUrl: data.payment_url,
    pidx:       data.pidx,           // Save this to verify later
  };
}

// ── Verify Payment (after Khalti redirects back) ───────────────────────────────
// Khalti sends ?pidx=... in return URL
async function verifyPayment(pidx) {
  const response = await fetch(`${KHALTI_BASE_URL}/api/v2/epayment/lookup/`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Key ${KHALTI_SECRET_KEY}`,
    },
    body: JSON.stringify({ pidx }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, message: data.detail || 'Verification failed' };
  }

  if (data.status !== 'Completed') {
    return { success: false, message: `Payment status: ${data.status}` };
  }

  return {
    success:         true,
    transactionId:   data.transaction_id,
    amount:          data.total_amount / 100,  // convert paisa back to Rs
    status:          data.status,
    data,
  };
}

module.exports = { initiatePayment, verifyPayment };
