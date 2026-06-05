// services/otpService.js — OTP Management

const otpStore = new Map(); // { contact: { code, expires, attempts } }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createOTP(contact) {
  const code    = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(contact, { code, expires, attempts: 0 });

  // In production: send via email/SMS
  // For now: log to console
  console.log(`\n🔐 OTP for ${contact}: ${code} (valid 10 mins)\n`);

  return code;
}

function verifyOTP(contact, code) {
  const record = otpStore.get(contact);
  if (!record) return { valid: false, message: 'OTP not found. Please request again.' };
  if (Date.now() > record.expires) {
    otpStore.delete(contact);
    return { valid: false, message: 'OTP expired. Please request again.' };
  }
  record.attempts++;
  if (record.attempts > 5) {
    otpStore.delete(contact);
    return { valid: false, message: 'Too many attempts. Please request again.' };
  }
  if (record.code !== code) {
    return { valid: false, message: `Invalid OTP. ${5 - record.attempts} attempts remaining.` };
  }
  otpStore.delete(contact);
  return { valid: true };
}

module.exports = { createOTP, verifyOTP };