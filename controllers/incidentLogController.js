const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getIncidents = async (req, res) => {
  try {
    const { type, severity, status } = req.query;
    const where = {};
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    const incidents = await prisma.incidentLog.findMany({ where, orderBy: { incidentDate: 'desc' } });
    res.json(incidents);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createIncident = async (req, res) => {
  try {
    const { incidentDate, type, title, description, involvedParty, reportedBy, witnesses, severity, actionTaken, followUpDate, notes } = req.body;
    if (!title) return res.status(400).json({ message: 'title required' });
    const i = await prisma.incidentLog.create({
      data: { incidentDate: incidentDate ? new Date(incidentDate) : new Date(), type: type || 'ACCIDENT', title, description: description || '', involvedParty: involvedParty || '', reportedBy: reportedBy || '', witnesses: witnesses || '', severity: severity || 'LOW', actionTaken: actionTaken || '', followUpDate: followUpDate ? new Date(followUpDate) : null, notes: notes || '' }
    });
    res.json(i);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateIncident = async (req, res) => {
  try {
    const { status, resolvedBy, actionTaken, followUpDate, notes } = req.body;
    const data = {};
    if (status) data.status = status;
    if (resolvedBy !== undefined) data.resolvedBy = resolvedBy;
    if (actionTaken !== undefined) data.actionTaken = actionTaken;
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (notes !== undefined) data.notes = notes;
    const i = await prisma.incidentLog.update({ where: { id: Number(req.params.id) }, data });
    res.json(i);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteIncident = async (req, res) => {
  try {
    await prisma.incidentLog.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const [open, critical, high, thisMonth, total] = await Promise.all([
      prisma.incidentLog.count({ where: { status: { in: ['OPEN','INVESTIGATING'] } } }),
      prisma.incidentLog.count({ where: { severity: 'CRITICAL', status: { not: 'CLOSED' } } }),
      prisma.incidentLog.count({ where: { severity: 'HIGH', status: { not: 'CLOSED' } } }),
      prisma.incidentLog.count({ where: { incidentDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.incidentLog.count(),
    ]);
    res.json({ open, critical, high, thisMonth, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
