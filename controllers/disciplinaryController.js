const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getRecords = async (req, res) => {
  try {
    const { staffId, type, status } = req.query;
    const where = {};
    if (staffId) where.staffId = Number(staffId);
    if (type) where.type = type;
    if (status) where.status = status;
    const records = await prisma.disciplinaryRecord.findMany({ where, orderBy: { incidentDate: 'desc' } });
    res.json(records);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createRecord = async (req, res) => {
  try {
    const { staffId, staffName, type, incident, incidentDate, issuedBy, witnesses, actionTaken, followUpDate, notes } = req.body;
    if (!staffId || !incident) return res.status(400).json({ message: 'staffId and incident required' });
    const rec = await prisma.disciplinaryRecord.create({
      data: {
        staffId: Number(staffId),
        staffName: staffName || '',
        type: type || 'VERBAL_WARNING',
        incident,
        incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
        issuedBy: issuedBy || '',
        witnesses: witnesses || '',
        actionTaken: actionTaken || '',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || '',
      },
    });
    res.status(201).json(rec);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const rec = await prisma.disciplinaryRecord.update({
      where: { id: Number(req.params.id) },
      data: { status, notes: notes || undefined, updatedAt: new Date() },
    });
    res.json(rec);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteRecord = async (req, res) => {
  try {
    await prisma.disciplinaryRecord.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const [open, resolved, escalated, byType] = await Promise.all([
      prisma.disciplinaryRecord.count({ where: { status: 'OPEN' } }),
      prisma.disciplinaryRecord.count({ where: { status: 'RESOLVED' } }),
      prisma.disciplinaryRecord.count({ where: { status: 'ESCALATED' } }),
      prisma.disciplinaryRecord.groupBy({ by: ['type'], _count: { id: true } }),
    ]);
    const followUpDue = await prisma.disciplinaryRecord.count({
      where: { followUpDate: { lte: new Date() }, status: 'OPEN' },
    });
    const typeMap = {};
    byType.forEach(r => { typeMap[r.type] = r._count.id; });
    res.json({ open, resolved, escalated, followUpDue, byType: typeMap });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getStaffHistory = async (req, res) => {
  try {
    const records = await prisma.disciplinaryRecord.findMany({
      where: { staffId: Number(req.params.staffId) },
      orderBy: { incidentDate: 'desc' },
    });
    res.json(records);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
