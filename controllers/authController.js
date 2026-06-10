// controllers/authController.js
const jwt    = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { generateToken } = require('../middleware/auth');
const { createOTP, verifyOTP } = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET || 'restaurant_secret_key';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username ra password halnus' });

    const user = await prisma.user.findFirst({
      where: { username, password, active: true },
    });
    if (!user)
      return res.status(401).json({ success: false, message: 'Galat username vaa password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Change password — requires auth middleware (username from JWT, not body)
exports.changePassword = async (req, res) => {
  try {
    const username        = req.user?.username;   // set by auth middleware
    const { currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Sabai fields bhar­nus' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password kam se kam 6 characters hunu parcha' });

    const user = await prisma.user.findFirst({ where: { username, password: currentPassword } });
    if (!user) return res.status(401).json({ success: false, message: 'Purano password galat xa' });

    await prisma.user.update({ where: { id: user.id }, data: { password: newPassword } });
    res.json({ success: true, message: 'Password change bhayo!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Forgot password — find user by email, phone, OR username
exports.forgotPassword = async (req, res) => {
  try {
    const { contact } = req.body;
    if (!contact) return res.status(400).json({ success: false, message: 'Email, phone vaa username halnus' });

    // Trim and normalize contact
    const c = contact.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(c.includes('@') ? [{ email: c }] : []),
          ...(/^\d/.test(c)   ? [{ phone: c }] : []),
          { username: c },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User '${c}' भेटिएन। आफ्नो username, email, वा phone number हाल्नुस्।`,
      });
    }

    await createOTP(c);

    const isEmail = c.includes('@');
    const dest    = isEmail
      ? c.replace(/(.{2}).+(@.+)/, '$1***$2')
      : `${user.email || user.phone || c}`.slice(0, 4) + '****';

    res.json({
      success: true,
      message: `OTP ${isEmail ? 'email' : 'SMS/console'} ma pathaiyo`,
      hint: !user.email && !user.phone
        ? '⚠️ Email/phone set xena — OTP server console ma dekhincha'
        : null,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Verify OTP
exports.verifyOTP = (req, res) => {
  const { contact, otp } = req.body;
  if (!contact || !otp)
    return res.status(400).json({ success: false, message: 'Contact ra OTP chahincha' });

  const result = verifyOTP(contact.trim(), otp.trim());
  if (!result.valid) return res.status(400).json({ success: false, message: result.message });

  const resetToken = jwt.sign(
    { contact: contact.trim(), purpose: 'reset' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  res.json({ success: true, resetToken });
};

// Reset password using resetToken from verifyOTP
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword)
      return res.status(400).json({ success: false, message: 'Token ra naya password chahincha' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password kam se kam 6 characters hunu parcha' });

    // Verify the reset JWT
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(400).json({
        success: false,
        message: jwtErr.name === 'TokenExpiredError'
          ? 'OTP expire bhayo — pheri request garus (15 min limit)'
          : 'Invalid reset token',
      });
    }

    if (decoded.purpose !== 'reset')
      return res.status(400).json({ success: false, message: 'Invalid token purpose' });

    const c = decoded.contact;

    // Find user by whatever contact they used (email / phone / username)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(c.includes('@') ? [{ email: c }] : []),
          ...(/^\d/.test(c)   ? [{ phone: c }] : []),
          { username: c },
        ],
      },
    });

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found — contact support' });

    await prisma.user.update({ where: { id: user.id }, data: { password: newPassword } });

    console.log(`✅ Password reset for user: ${user.username} (contact: ${c})`);
    res.json({ success: true, message: 'Password reset bhayo! Login garus.' });

  } catch (e) {
    console.error('resetPassword error:', e);
    res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
};
