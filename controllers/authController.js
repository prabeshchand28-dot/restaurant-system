const bcrypt     = require('bcryptjs');
const { getDB }  = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { sendOTP }       = require('../services/notificationService');

// OTP valid: 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;

// ──────────────────────────────────────────────
// Helper: generate 6-digit OTP
// ──────────────────────────────────────────────
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ══════════════════════════════════════════════
// POST /api/auth/login
// Body: { username, password }
// ══════════════════════════════════════════════
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username ra password halnus' });
    }

    const db   = getDB();
    const user = db.prepare(`
      SELECT * FROM users
      WHERE (username = ? OR email = ? OR phone = ?) AND is_active = 1
    `).get(username, username, username);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Galat username vaa password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Galat username vaa password' });
    }

    const token = generateToken(user);

    // Set token in cookie (optional — frontend pani localStorage ma rakhna sakcha)
    res.cookie('token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   8 * 60 * 60 * 1000,   // 8 hours
      sameSite: 'lax',
    });

    return res.json({
      success: true,
      message: 'Login safal bhayo',
      token,
      user: {
        id:       user.id,
        username: user.username,
        email:    user.email,
        phone:    user.phone,
        role:     user.role,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ══════════════════════════════════════════════
// POST /api/auth/logout
// ══════════════════════════════════════════════
function logout(req, res) {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logout bhayo' });
}

// ══════════════════════════════════════════════
// POST /api/auth/change-password
// Headers: Authorization: Bearer <token>
// Body: { currentPassword, newPassword }
// ══════════════════════════════════════════════
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Sabai fields halnus' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password kam se kam 8 characters hunu parcha' });
    }

    const db   = getDB();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User felauna sakiyena' });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Purano password galat cha' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = strftime('%s','now') WHERE id = ?
    `).run(newHash, userId);

    return res.json({ success: true, message: 'Password successfully change bhayo' });

  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ══════════════════════════════════════════════
// POST /api/auth/forgot-password
// Body: { contact, method }   method: 'email' | 'phone'
// ══════════════════════════════════════════════
async function forgotPassword(req, res) {
  try {
    const { contact, method } = req.body;

    if (!contact || !method) {
      return res.status(400).json({ success: false, message: 'Contact ra method halnus' });
    }

    const db   = getDB();
    const user = method === 'email'
      ? db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(contact)
      : db.prepare('SELECT * FROM users WHERE phone = ? AND is_active = 1').get(contact);

    if (!user) {
      // Security: real contact nabhaye pani same response dinus (enumeration attack rokna)
      return res.json({ success: true, message: 'OTP pathaiyo (yedi account cha bhane)' });
    }

    const otp    = generateOTP();
    const expiry = Date.now() + OTP_EXPIRY_MS;

    db.prepare(`
      UPDATE users SET reset_otp = ?, otp_expiry = ?, otp_contact = ?, updated_at = strftime('%s','now')
      WHERE id = ?
    `).run(otp, expiry, contact, user.id);

    // Send OTP
    const result = await sendOTP(contact, method, otp);

    if (!result.success) {
      console.error('OTP send failed:', result.error);
      // Dev mode ma pani response dinus
    }

    return res.json({ success: true, message: `OTP ${method === 'email' ? 'email' : 'phone'} ma pathaiyo` });

  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ══════════════════════════════════════════════
// POST /api/auth/verify-otp
// Body: { contact, otp }
// ══════════════════════════════════════════════
function verifyOTP(req, res) {
  try {
    const { contact, otp } = req.body;

    if (!contact || !otp) {
      return res.status(400).json({ success: false, message: 'Contact ra OTP halnus' });
    }

    const db   = getDB();
    const user = db.prepare(`
      SELECT * FROM users WHERE otp_contact = ? AND is_active = 1
    `).get(contact);

    if (!user || !user.reset_otp) {
      return res.status(400).json({ success: false, message: 'OTP felauna sakiyena. Pheri try garus' });
    }

    if (Date.now() > user.otp_expiry) {
      return res.status(400).json({ success: false, message: 'OTP expire bhayo. Pheri pathaunus' });
    }

    if (otp && user.reset_otp !== String(otp)) {
  return res.status(400).json({ success: false, message: 'Galat OTP' });
}

    // OTP verified — return a short-lived reset token
    const resetToken = generateToken({ id: user.id, username: user.username, role: 'reset' });

    return res.json({
      success: true,
      message: 'OTP verified',
      resetToken,   // Frontend le yo token liera /reset-password ma use garcha
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ══════════════════════════════════════════════
// POST /api/auth/reset-password
// Body: { contact, otp, newPassword }
// ══════════════════════════════════════════════
async function resetPassword(req, res) {
  try {
    const { contact, otp, newPassword } = req.body;

    if (!contact || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Sabai fields halnus' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password kam se kam 8 characters hunu parcha' });
    }

    const db   = getDB();
    const user = db.prepare('SELECT * FROM users WHERE otp_contact = ? AND is_active = 1').get(contact);

    if (!user || !user.reset_otp) {
      return res.status(400).json({ success: false, message: 'Invalid reset request' });
    }
    if (Date.now() > user.otp_expiry) {
      return res.status(400).json({ success: false, message: 'OTP expire bhayo. Pheri try garus' });
    }
    if (user.reset_otp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Galat OTP' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    // Password update ra OTP clear
    db.prepare(`
      UPDATE users
      SET password_hash = ?, reset_otp = NULL, otp_expiry = NULL, otp_contact = NULL,
          updated_at = strftime('%s','now')
      WHERE id = ?
    `).run(newHash, user.id);

    return res.json({ success: true, message: 'Password reset bhayo! Login garus' });

  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ══════════════════════════════════════════════
// GET /api/auth/me  (optional — current user info)
// ══════════════════════════════════════════════
function getMe(req, res) {
  const db   = getDB();
  const user = db.prepare('SELECT id, username, email, phone, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User felauna sakiyena' });
  return res.json({ success: true, user });
}

module.exports = { login, logout, changePassword, forgotPassword, verifyOTP, resetPassword, getMe };