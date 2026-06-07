// models/Menu.js — Prisma wrapper
const prisma = require('../config/prisma');

module.exports = {
  findAll:    ()   => prisma.menuItem.findMany({ orderBy: { id: 'asc' } }),
  findById:   (id) => prisma.menuItem.findUnique({ where: { id } }),
  findByName: (n)  => prisma.menuItem.findMany({ where: { name: { contains: n } } }),
  create:     (data) => prisma.menuItem.create({ data }),
  update:     (id, data) => prisma.menuItem.update({ where: { id }, data }),
  delete:     (id) => prisma.menuItem.delete({ where: { id } }),
};
