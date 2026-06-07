// models/Order.js — Prisma wrapper
const prisma = require('../config/prisma');

const shapeOrder = o => ({
  id: o.id, table: o.tableNumber, tableId: o.tableId,
  status: o.status, estimatedWait: o.estimatedWait,
  guests: o.guestCount, notes: o.notes,
  time: o.createdAt, completedAt: o.completedAt,
  items: (o.items || []).map(i => ({ name: i.name, qty: i.qty, price: i.price })),
});

module.exports = {
  findAll:     ()   => prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'asc' } }).then(r => r.map(shapeOrder)),
  findById:    (id) => prisma.order.findUnique({ where: { id }, include: { items: true } }).then(o => o ? shapeOrder(o) : null),
  findByTable: (t)  => prisma.order.findMany({ where: { tableNumber: t }, include: { items: true }, orderBy: { createdAt: 'desc' } }).then(r => r.map(shapeOrder)),
  findActive:  ()   => prisma.order.findMany({ where: { status: { in: ['Pending','Preparing'] } }, include: { items: true }, orderBy: { createdAt: 'asc' } }).then(r => r.map(shapeOrder)),
  create:      (data) => prisma.order.create({ data, include: { items: true } }).then(shapeOrder),
  updateStatus:(id, status) => prisma.order.update({ where: { id }, data: { status, ...(status==='Completed'?{completedAt:new Date()}:{}) }, include: { items: true } }).then(shapeOrder),
  delete:      (id) => prisma.order.delete({ where: { id } }),
};
