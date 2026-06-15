// controllers/staffController.js
const prisma = require('../config/prisma');

const safeUser = u => ({ id: u.id, username: u.username, name: u.name, role: u.role, email: u.email, phone: u.phone, active: u.active, createdAt: u.createdAt });

exports.getAll = async (req, res) => {
  const users = await prisma.user.findMany({ where: { restaurantId: req.restaurantId || 1 }, orderBy: { id: 'asc' } });
  res.json(users.map(safeUser));
};

exports.create = async (req, res) => {
  try {
    const { username, password, name, role, email, phone } = req.body;
    if (!username || !password || !name || !role)
      return res.status(400).json({ success: false, message: 'username, password, name, role required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!['admin','manager','waiter','kitchen'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });
    const user = await prisma.user.create({ data: { restaurantId: req.restaurantId || 1, username, password, name, role, email: email || '', phone: phone || '' } });
    res.json({ success: true, user: safeUser(user) });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ success: false, message: 'Username already exists' });
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, role, email, phone, active, password } = req.body;
    const data = {};
    if (name   !== undefined) data.name   = name;
    if (role   !== undefined) data.role   = role;
    if (email  !== undefined) data.email  = email;
    if (phone  !== undefined) data.phone  = phone;
    if (active !== undefined) data.active = active;
    if (password && password.length >= 6) data.password = password;
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data });
    res.json({ success: true, user: safeUser(user) });
  } catch (e) { res.status(404).json({ success: false, message: 'User not found' }); }
};

exports.remove = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === 1) return res.status(400).json({ success: false, message: 'Cannot delete primary admin' });
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ success: false, message: 'Cannot delete this user' }); }
};
