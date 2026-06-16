// services/esewaService.js — eSewa v2 Payment Integration
const crypto = require('crypto');

// ── Config ────────────────────────────────────────────────────────────────────
// Test credentials (replace with real ones from merchant.esewa.com.np)
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
const ESEWA_SECRET_KEY   = process.env.ESEWA_SECRET_KEY   || '8gBm/:&EnhH.1/q';
const ESEWA_BASE_URL     = process.env.NODE_ENV === 'production'
  ? 'https://epay.esewa.com.np'
  : 'https://rc-epay.esewa.com.np';   // test environment

// ── HMAC-SHA256 Signature ─────────────────────────────────────────────────────
function generateSignature(message) {
  return crypto
    .createHmac('sha256', ESEWA_SECRET_KEY)
    .update(message)
    .digest('base64');
}

// ── Initiate Payment ──────────────────────────────────────────────────────────
// Returns form fields to POST to eSewa
function initiatePayment({ orderId, amount, taxAmount = 0, successUrl, failureUrl }) {
  const totalAmount       = amount + taxAmount;
  const transactionUuid   = `order-${orderId}-${Date.now()}`;
  const productServiceCharge  = 0;
  const productDeliveryCharge = 0;

  // Fields to sign: total_amount,transaction_uuid,product_code
  const signedFieldNames = 'total_amount,transaction_uuid,product_code';
  const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`;
  const signature = generateSignature(signatureMessage);

  return {
    paymentUrl: `${ESEWA_BASE_URL}/api/epay/main/v2/form`,
    fields: {
      amount:                   amount,
      tax_amount:               taxAmount,
      total_amount:             totalAmount,
      transaction_uuid:         transactionUuid,
      product_code:             ESEWA_PRODUCT_CODE,
      product_service_charge:   productServiceCharge,
      product_delivery_charge:  productDeliveryCharge,
      success_url:              successUrl,
      failure_url:              failureUrl,
      signed_field_names:       signedFieldNames,
      signature:                signature,
    },
  };
}

// ── Verify Payment (after eSewa redirects back) ───────────────────────────────
// eSewa sends base64-encoded JSON in ?data= query param
async function verifyPayment(encodedData) {
  try {
    // Decode the base64 data
    const decoded = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));

    const {
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
      signature,
    } = decoded;

    // Re-compute signature to verify
    const fields = signed_field_names.split(',');
    const message = fields.map(f => `${f}=${decoded[f]}`).join(',');
    const expectedSignature = generateSignature(message);

    if (signature !== expectedSignature) {
      return { success: false, message: 'Invalid signature — payment tampered' };
    }

    if (status !== 'COMPLETE') {
      return { success: false, message: `Payment status: ${status}` };
    }

    // Cross-check with eSewa lookup API
    const verifyUrl = `${ESEWA_BASE_URL}/api/epay/transaction/status/?product_code=${ESEWA_PRODUCT_CODE}&transaction_uuid=${transaction_uuid}&total_amount=${total_amount}`;
    const response = await fetch(verifyUrl);
    const verifyData = await response.json();

    if (verifyData.status !== 'COMPLETE') {
      return { success: false, message: 'Payment not confirmed by eSewa' };
    }

    return {
      success: true,
      transactionCode: transaction_code,
      transactionUuid: transaction_uuid,
      amount: total_amount,
      data: verifyData,
    };
  } catch (e) {
    return { success: false, message: 'Verification failed: ' + e.message };
  }
}

module.exports = { initiatePayment, verifyPayment };
