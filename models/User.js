// models/User.js — Prisma wrapper
const prisma = require('../config/prisma');

const safe = u => ({ id: u.id, username: u.username, name: u.name, role: u.role, email: u.email, phone: u.phone, active: u.active, createdAt: u.createdAt });

module.exports = {
  findAll:       () => prisma.user.findMany({ orderBy: { id: 'asc' } }).then(r => r.map(safe)),
  findById:      (id) => prisma.user.findUnique({ where: { id } }).then(u => u ? safe(u) : null),
  findByUsername:(username) => prisma.user.findFirst({ where: { username } }),
  findActive:    (username) => prisma.user.findFirst({ where: { username, active: true } }),
  create:        (data) => prisma.user.create({ data }).then(safe),
  update:        (id, data) => prisma.user.update({ where: { id }, data }).then(safe),
  delete:        (id) => prisma.user.delete({ where: { id } }),
};
