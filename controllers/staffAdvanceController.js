const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const { staffId, status } = req.query;
    const where = {};
    if (staffId) where.staffId = parseInt(staffId);
    if (status) where.status = status;
    const advances = await prisma.staffAdvance.findMany({ where, orderBy: { issuedAt: 'desc' } });
    res.json(advances);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { staffId, amount, reason = '', issuedBy = '', repaymentType = 'DEDUCTION', installments = 1, notes = '' } = req.body;
    if (!staffId || !amount) return res.status(400).json({ message: 'staffId and amount required' });
    let staffName = '';
    const staff = await prisma.user.findUnique({ where: { id: parseInt(staffId) } });
    staffName = staff?.name || '';
    const advance = await prisma.staffAdvance.create({
      data: { staffId: parseInt(staffId), staffName, amount: parseFloat(amount), reason, issuedBy, repaymentType, installments: parseInt(installments), notes },
    });
    res.json(advance);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.repay = async (req, res) => {
  try {
    const { amount } = req.body;
    const advance = await prisma.staffAdvance.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!advance) return res.status(404).json({ message: 'Not found' });
    const newRepaid = advance.amountRepaid + parseFloat(amount);
    const status = newRepaid >= advance.amount ? 'CLEARED' : 'PARTIAL';
    const updated = await prisma.staffAdvance.update({
      where: { id: parseInt(req.params.id) },
      data: { amountRepaid: newRepaid, status },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.staffAdvance.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.stats = async (req, res) => {
  try {
    const [outstanding, partial, cleared, totalAgg, repaidAgg] = await Promise.all([
      prisma.staffAdvance.count({ where: { status: 'OUTSTANDING' } }),
      prisma.staffAdvance.count({ where: { status: 'PARTIAL' } }),
      prisma.staffAdvance.count({ where: { status: 'CLEARED' } }),
      prisma.staffAdvance.aggregate({ _sum: { amount: true } }),
      prisma.staffAdvance.aggregate({ _sum: { amountRepaid: true } }),
    ]);
    const totalIssued = totalAgg._sum.amount || 0;
    const totalRepaid = repaidAgg._sum.amountRepaid || 0;
    res.json({ outstanding, partial, cleared, totalIssued, totalRepaid, totalOutstanding: totalIssued - totalRepaid });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
