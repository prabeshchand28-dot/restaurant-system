// models/Payment.js — Prisma wrapper
const prisma = require('../config/prisma');

module.exports = {
  findAll:    () => prisma.payment.findMany({ include: { order: { include: { items: true } } }, orderBy: { createdAt: 'desc' } }),
  create:     (data) => prisma.payment.create({ data }),
  summary:    async () => {
    const payments = await prisma.payment.findMany();
    const total    = payments.reduce((s, p) => s + p.amount, 0);
    const byMethod = payments.reduce((acc, p) => { acc[p.method] = (acc[p.method]||0) + p.amount; return acc; }, {});
    return { total, count: payments.length, byMethod };
  },
};
