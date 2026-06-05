// routes/staff.js — Staff/User Management
const express = require('express');
const router  = express.Router();
const prisma  = require('../config/prisma');

const safeUser = u => ({
  id: u.id, username: u.username, name: u.name,
  role: u.role, email: u.email, phone: u.phone,
  active: u.active, createdAt: u.createdAt,
});

// GET /api/staff
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  res.json(users.map(safeUser));
});

// POST /api/staff
router.post('/', async (req, res) => {
  try {
    const { username, password, name, role, email, phone } = req.body;
    if (!username || !password || !name || !role)
      return res.status(400).json({ success: false, message: 'username, password, name, role required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const validRoles = ['admin', 'manager', 'waiter', 'kitchen'];
    if (!validRoles.includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });

    const user = await prisma.user.create({
      data: { username, password, name, role, email: email || '', phone: phone || '' },
    });
    res.json({ success: true, user: safeUser(user) });
  } catch (e) {
    if (e.code === 'P2002')
      return res.status(400).json({ success: false, message: 'Username already exists' });
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/staff/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, role, email, phone, active, password } = req.body;
    const data = {};
    if (name     !== undefined) data.name   = name;
    if (role     !== undefined) data.role   = role;
    if (email    !== undefined) data.email  = email;
    if (phone    !== undefined) data.phone  = phone;
    if (active   !== undefined) data.active = active;
    if (password && password.length >= 6) data.password = password;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json({ success: true, user: safeUser(user) });
  } catch (e) {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === 1) return res.status(400).json({ success: false, message: 'Cannot delete primary admin' });
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Cannot delete this user' });
  }
});

module.exports = router;
