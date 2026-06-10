const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUniforms = async (req, res) => {
  try {
    const { staffId, status } = req.query;
    const where = {};
    if (staffId) where.staffId = Number(staffId);
    if (status === 'issued') where.returnedAt = null;
    if (status === 'returned') where.NOT = { returnedAt: null };
    const uniforms = await prisma.staffUniform.findMany({ where, orderBy: { issuedAt: 'desc' } });
    res.json(uniforms);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.issueUniform = async (req, res) => {
  try {
    const { staffId, staffName, uniformType, size, quantity, lockerNumber, keyIssued, keyNumber, issuedBy, notes } = req.body;
    if (!staffId) return res.status(400).json({ message: 'staffId required' });
    const u = await prisma.staffUniform.create({
      data: { staffId: Number(staffId), staffName: staffName || '', uniformType: uniformType || 'SHIRT', size: size || '', quantity: Number(quantity) || 1, lockerNumber: lockerNumber || '', keyIssued: !!keyIssued, keyNumber: keyNumber || '', issuedBy: issuedBy || '', notes: notes || '' }
    });
    res.json(u);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.returnUniform = async (req, res) => {
  try {
    const { condition, notes } = req.body;
    const u = await prisma.staffUniform.update({
      where: { id: Number(req.params.id) },
      data: { returnedAt: new Date(), condition: condition || 'GOOD', notes: notes || '' }
    });
    res.json(u);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteUniform = async (req, res) => {
  try {
    await prisma.staffUniform.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const [total, issued, withLocker, keyCount] = await Promise.all([
      prisma.staffUniform.count(),
      prisma.staffUniform.count({ where: { returnedAt: null } }),
      prisma.staffUniform.count({ where: { lockerNumber: { not: '' }, returnedAt: null } }),
      prisma.staffUniform.count({ where: { keyIssued: true, returnedAt: null } }),
    ]);
    res.json({ total, issued, returned: total - issued, withLocker, keyCount });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
