// models/Table.js — Prisma wrapper
const prisma = require('../config/prisma');

module.exports = {
  findAll:    () => prisma.restaurantTable.findMany({ where: { active: true }, orderBy: { number: 'asc' } }),
  findByNum:  (n) => prisma.restaurantTable.findUnique({ where: { number: n } }),
  upsert:     (number, capacity=4) => prisma.restaurantTable.upsert({ where: { number }, update: { active: true }, create: { number, capacity } }),
  deactivate: (number) => prisma.restaurantTable.update({ where: { number }, data: { active: false } }),
};
