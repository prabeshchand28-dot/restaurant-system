// routes/auth.js
const express    = require('express');
const router     = express.Router();
const jwt        = require('jsonwebtoken');
const prisma     = require('../config/prisma');
const { createOTP, verifyOTP } = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET || 'restaurant_secret';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { username, password, active: true },
    });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    if (!username || !currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'All fields required' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const user = await prisma.user.findFirst({ where: { username, password: currentPassword } });
    if (!user) return res.status(401).json({ success: false, message: 'Current password incorrect' });

    await prisma.user.update({ where: { id: user.id }, data: { password: newPassword } });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { contact } = req.body;
    if (!contact) return res.status(400).json({ success: false, message: 'Contact required' });
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: contact }, { phone: contact }, { username: contact }] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    createOTP(contact);
    res.json({ success: true, message: `OTP sent to ${contact}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { contact, otp } = req.body;
  const result = verifyOTP(contact, otp);
  if (!result.valid) return res.status(400).json({ success: false, message: result.message });
  const resetToken = jwt.sign({ contact, purpose: 'reset' }, JWT_SECRET, { expiresIn: '15m' });
  res.json({ success: true, resetToken });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ success: false, message: 'All fields required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Min 6 characters' });

    const decoded = jwt.verify(resetToken, JWT_SECRET);
    if (decoded.purpose !== 'reset') throw new Error('Invalid token');

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: decoded.contact }, { phone: decoded.contact }, { username: decoded.contact }] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await prisma.user.update({ where: { id: user.id }, data: { password: newPassword } });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
