const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAudits = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from) where.auditDate = { gte: new Date(from) };
    if (to) { where.auditDate = { ...where.auditDate, lte: new Date(to + 'T23:59:59') }; }
    const audits = await prisma.nightAudit.findMany({ where, orderBy: { auditDate: 'desc' }, take: 90 });
    res.json(audits);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getToday = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const audit = await prisma.nightAudit.findFirst({ where: { auditDate: today } });
    res.json(audit || null);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.upsertAudit = async (req, res) => {
  try {
    const { auditDate, expectedRevenue, actualRevenue, cashOnHand, cardRevenue,
      coversServed, ordersCount, voidAmount, discountAmount, staffMealCost,
      wasteAmount, openingFloat, closingFloat, notes, closedBy } = req.body;

    const date = auditDate ? new Date(auditDate) : new Date();
    date.setHours(0,0,0,0);
    const actual = parseFloat(actualRevenue || 0);
    const covers = parseInt(coversServed || 0);
    const orders = parseInt(ordersCount || 0);
    const avgSpend = orders > 0 ? Math.round(actual / orders * 100) / 100 : 0;

    const data = {
      expectedRevenue: parseFloat(expectedRevenue || 0),
      actualRevenue: actual,
      cashOnHand: parseFloat(cashOnHand || 0),
      cardRevenue: parseFloat(cardRevenue || 0),
      coversServed: covers,
      ordersCount: orders,
      avgSpend,
      voidAmount: parseFloat(voidAmount || 0),
      discountAmount: parseFloat(discountAmount || 0),
      staffMealCost: parseFloat(staffMealCost || 0),
      wasteAmount: parseFloat(wasteAmount || 0),
      openingFloat: parseFloat(openingFloat || 0),
      closingFloat: parseFloat(closingFloat || 0),
      notes: notes || '',
      closedBy: closedBy || '',
    };

    const audit = await prisma.nightAudit.upsert({
      where: { auditDate: date },
      update: { ...data, updatedAt: new Date() },
      create: { auditDate: date, ...data },
    });
    res.json(audit);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteAudit = async (req, res) => {
  try {
    await prisma.nightAudit.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.summary = async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const from = new Date(); from.setDate(from.getDate() - days); from.setHours(0,0,0,0);
    const audits = await prisma.nightAudit.findMany({ where: { auditDate: { gte: from } }, orderBy: { auditDate: 'asc' } });
    const agg = await prisma.nightAudit.aggregate({
      _sum: { actualRevenue: true, coversServed: true, voidAmount: true, discountAmount: true },
      _avg: { avgSpend: true },
      where: { auditDate: { gte: from } },
    });
    res.json({ audits, totals: agg._sum, avgSpend: agg._avg.avgSpend || 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
