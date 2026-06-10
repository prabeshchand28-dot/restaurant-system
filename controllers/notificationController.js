const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EVENTS = [
  'ORDER_READY', 'ORDER_PLACED', 'RESERVATION_CONFIRMED', 'RESERVATION_REMINDER',
  'LOW_STOCK', 'PAYROLL_PROCESSED', 'DELIVERY_ASSIGNED', 'DELIVERY_DELIVERED',
  'LOYALTY_POINTS_EARNED', 'COUPON_EXPIRING', 'SHIFT_REMINDER',
];

exports.getEvents = async (req, res) => {
  res.json(EVENTS);
};

// Templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await prisma.notificationTemplate.findMany({ orderBy: { event: 'asc' } });
    res.json(templates);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, event, channel, subject, body } = req.body;
    if (!name || !event || !body) return res.status(400).json({ message: 'name, event, body required' });
    const template = await prisma.notificationTemplate.create({
      data: { name, event, channel: channel || 'SMS', subject: subject || '', body }
    });
    res.json(template);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await prisma.notificationTemplate.update({
      where: { id: +req.params.id }, data: req.body
    });
    res.json(template);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.toggleTemplate = async (req, res) => {
  try {
    const t = await prisma.notificationTemplate.findUnique({ where: { id: +req.params.id } });
    const updated = await prisma.notificationTemplate.update({ where: { id: +req.params.id }, data: { active: !t.active } });
    res.json(updated);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await prisma.notificationTemplate.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Logs
exports.getLogs = async (req, res) => {
  try {
    const { event, status, limit = 50 } = req.query;
    const where = {};
    if (event) where.event = event;
    if (status) where.status = status;
    const logs = await prisma.notificationLog.findMany({
      where, orderBy: { createdAt: 'desc' }, take: +limit
    });
    res.json(logs);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Send test / manual notification (simulated — no real SMS/email in demo)
exports.sendTest = async (req, res) => {
  try {
    const { event, channel, recipient, subject, body } = req.body;
    if (!recipient || !body) return res.status(400).json({ message: 'recipient and body required' });
    // Simulate send — in production connect to Twilio/SendGrid here
    const log = await prisma.notificationLog.create({
      data: { event: event || 'MANUAL', channel: channel || 'SMS', recipient, subject: subject || '', body, status: 'SENT' }
    });
    res.json({ success: true, log, message: `Simulated ${channel || 'SMS'} sent to ${recipient}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [total, sent, failed] = await Promise.all([
      prisma.notificationLog.count(),
      prisma.notificationLog.count({ where: { status: 'SENT' } }),
      prisma.notificationLog.count({ where: { status: 'FAILED' } }),
    ]);
    const byEvent = await prisma.notificationLog.groupBy({ by: ['event'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 });
    res.json({ total, sent, failed, byEvent: byEvent.map(e => ({ event: e.event, count: e._count.id })) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
