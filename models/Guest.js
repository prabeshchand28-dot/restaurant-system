// models/Guest.js — Prisma wrapper
const prisma = require('../config/prisma');

module.exports = {
  findAll:  () => prisma.guest.findMany({ orderBy: { createdAt: 'desc' } }),
  create:   (data) => prisma.guest.create({ data }),
  summary:  async () => {
    const guests = await prisma.guest.findMany();
    const total  = guests.reduce((s, g) => s + g.count, 0);
    const byGender = guests.reduce((acc, g) => { acc[g.gender] = (acc[g.gender]||0) + g.count; return acc; }, {});
    return { total, byGender };
  },
};
