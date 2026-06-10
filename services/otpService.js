// services/otpService.js — OTP Management with real Email + SMS delivery

const nodemailer = require('nodemailer');
require('dotenv').config();

const otpStore = new Map(); // { contact: { code, expires, attempts } }

// ── Email transporter ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Generate 6-digit OTP ──────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Send OTP via Email ────────────────────────────────────────────────
async function sendEmailOTP(email, code) {
  await transporter.sendMail({
    from:    `"Restaurant System" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: `Your Password Reset OTP: ${code}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f0f2f5;border-radius:12px">
        <div style="background:#1a3a6b;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;text-align:center">
          <h2 style="margin:0;font-size:20px">Restaurant System</h2>
          <p style="margin:4px 0 0;opacity:.8;font-size:13px">Password Reset OTP</p>
        </div>
        <div style="background:#fff;padding:28px 24px;border-radius:0 0 8px 8px">
          <p style="color:#333;font-size:15px">Your One-Time Password (OTP) for password reset:</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:48px;font-weight:900;letter-spacing:12px;color:#1a3a6b;font-family:monospace">${code}</span>
          </div>
          <p style="color:#666;font-size:13px">Valid for <strong>10 minutes</strong>. Do not share this code.</p>
          <p style="color:#999;font-size:11px;margin-top:20px">If you did not request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
  console.log(`📧 OTP email sent to ${email}: ${code}`);
}

// ── Send OTP via Sparrow SMS (Nepal) ──────────────────────────────────
async function sendSmsOTP(phone, code) {
  const token = process.env.SPARROW_TOKEN;
  if (!token) {
    console.log(`📱 SMS skipped — SPARROW_TOKEN not set. OTP for ${phone}: ${code}`);
    return;
  }
  // Normalize: strip leading 0, add 977 country code
  let num = phone.replace(/\D/g, '');
  if (num.startsWith('0')) num = '977' + num.slice(1);
  if (!num.startsWith('977')) num = '977' + num;

  const params = new URLSearchParams({
    token,
    from: 'Restaurant',
    to:   num,
    text: `Your Restaurant System OTP is: ${code}. Valid 10 mins. Do not share.`,
  });
  const res  = await fetch(`https://api.sparrowsms.com/v2/sms/?${params}`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  console.log(`📱 Sparrow SMS to ${num}:`, data);
}

// ── Create & send OTP (async — controller must await) ─────────────────
async function createOTP(contact) {
  const code    = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(contact, { code, expires, attempts: 0 });
  console.log(`\n🔐 OTP for ${contact}: ${code}\n`);

  const isEmail = contact.includes('@');
  try {
    if (isEmail) await sendEmailOTP(contact, code);
    else         await sendSmsOTP(contact, code);
  } catch (err) {
    // Delivery failure doesn't invalidate the OTP — still usable
    console.error(`⚠️  OTP delivery error (${contact}):`, err.message);
  }
  return code;
}

// ── Verify OTP ────────────────────────────────────────────────────────
function verifyOTP(contact, code) {
  const record = otpStore.get(contact);
  if (!record) return { valid: false, message: 'OTP फेला परेन। फेरि request गर्नुस्।' };
  if (Date.now() > record.expires) {
    otpStore.delete(contact);
    return { valid: false, message: 'OTP expire भयो। फेरि request गर्नुस्।' };
  }
  record.attempts++;
  if (record.attempts > 5) {
    otpStore.delete(contact);
    return { valid: false, message: 'धेरै पटक गलत। फेरि request गर्नुस्।' };
  }
  if (record.code !== code) {
    return { valid: false, message: `गलत OTP। ${5 - record.attempts} attempts बाँकी।` };
  }
  otpStore.delete(contact);
  return { valid: true };
}

module.exports = { createOTP, verifyOTP };
