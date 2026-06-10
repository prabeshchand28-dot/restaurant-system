const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getNominations = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    const where = {};
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);
    if (status) where.status = status;
    const recs = await prisma.staffRecognition.findMany({ where, orderBy: [{ year: 'desc' }, { month: 'desc' }, { votes: 'desc' }] });
    res.json(recs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.nominate = async (req, res) => {
  try {
    const { staffId, staffName, month, year, award, nominatedBy, reason, notes } = req.body;
    if (!staffId || !month || !year) return res.status(400).json({ message: 'staffId, month, year required' });
    const r = await prisma.staffRecognition.upsert({
      where: { staffId_month_year_award: { staffId: Number(staffId), month: Number(month), year: Number(year), award: award || 'EMPLOYEE_OF_MONTH' } },
      update: { votes: { increment: 1 }, notes: notes || '' },
      create: { staffId: Number(staffId), staffName: staffName || '', month: Number(month), year: Number(year), award: award || 'EMPLOYEE_OF_MONTH', nominatedBy: nominatedBy || '', reason: reason || '', notes: notes || '' }
    });
    res.json(r);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.approve = async (req, res) => {
  try {
    const { approvedBy, status } = req.body;
    const r = await prisma.staffRecognition.update({
      where: { id: Number(req.params.id) },
      data: { status: status || 'APPROVED', approvedBy: approvedBy || '' }
    });
    res.json(r);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteNomination = async (req, res) => {
  try {
    await prisma.staffRecognition.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const [total, thisMonth, awarded] = await Promise.all([
      prisma.staffRecognition.count(),
      prisma.staffRecognition.count({ where: { month: now.getMonth() + 1, year: now.getFullYear() } }),
      prisma.staffRecognition.count({ where: { status: 'AWARDED' } }),
    ]);
    res.json({ total, thisMonth, awarded, nominated: total - awarded });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
