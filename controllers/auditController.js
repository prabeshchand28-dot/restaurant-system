const prisma = require('../config/prisma');

// Helper — call this from other controllers to log actions
exports.log = async ({ userId, userName, userRole, action, resource, resourceId, details, ip }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId:     userId     ? parseInt(userId) : null,
        userName:   userName   || '',
        userRole:   userRole   || '',
        action:     action     || 'ACTION',
        resource:   resource   || '',
        resourceId: resourceId ? String(resourceId) : '',
        details:    details    || '',
        ip:         ip         || '',
      },
    });
  } catch (_) { /* never block main flow */ }
};

exports.getAll = async (req, res) => {
  try {
    const { resource, action, limit = 100, offset = 0 } = req.query;
    const where = {};
    if (resource) where.resource = resource;
    if (action)   where.action   = action;
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:   parseInt(limit),
      skip:   parseInt(offset),
    });
    const total = await prisma.auditLog.count({ where });
    res.json({ logs, total });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const all = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 });
    const byAction   = all.reduce((a, l) => { a[l.action]   = (a[l.action]   || 0) + 1; return a; }, {});
    const byResource = all.reduce((a, l) => { a[l.resource] = (a[l.resource] || 0) + 1; return a; }, {});
    const byUser     = all.reduce((a, l) => { if (l.userName) { a[l.userName] = (a[l.userName] || 0) + 1; } return a; }, {});
    res.json({ total: all.length, byAction, byResource, byUser, recent: all.slice(0, 20) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
