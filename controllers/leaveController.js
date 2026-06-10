const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = parseInt(userId);
    const requests = await prisma.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(requests);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { userId, userName, userRole, type, startDate, endDate, days, reason } = req.body;
    if (!userId || !type || !startDate || !endDate)
      return res.status(400).json({ success: false, message: 'userId, type, startDate, endDate required' });
    const req_ = await prisma.leaveRequest.create({
      data: { userId: parseInt(userId), userName: userName||'', userRole: userRole||'', type, startDate, endDate, days: parseInt(days)||1, reason: reason||'' },
    });
    res.json({ success: true, request: req_ });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.review = async (req, res) => {
  try {
    const { status, reviewedBy, reviewNote } = req.body;
    if (!['Approved', 'Rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'status must be Approved or Rejected' });
    const req_ = await prisma.leaveRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status, reviewedBy: reviewedBy||'', reviewNote: reviewNote||'' },
    });
    res.json({ success: true, request: req_ });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.leaveRequest.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getSummary = async (req, res) => {
  try {
    const all = await prisma.leaveRequest.findMany();
    const pending = all.filter(r => r.status === 'Pending').length;
    const approved = all.filter(r => r.status === 'Approved').length;
    const byType = all.reduce((acc, r) => { acc[r.type] = (acc[r.type]||0) + r.days; return acc; }, {});
    res.json({ total: all.length, pending, approved, byType });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
