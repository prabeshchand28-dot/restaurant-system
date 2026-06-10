const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getList = async (req, res) => {
  try {
    const { status, severity, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (search) where.OR = [{ guestName: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }];
    const list = await prisma.guestBlacklist.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(list);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addGuest = async (req, res) => {
  try {
    const { guestName, phone, email, reason, severity, addedBy, notes } = req.body;
    if (!guestName || !reason) return res.status(400).json({ message: 'guestName and reason required' });
    const g = await prisma.guestBlacklist.create({
      data: { guestName, phone: phone || '', email: email || '', reason, severity: severity || 'MEDIUM', addedBy: addedBy || '', notes: notes || '' }
    });
    res.json(g);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.liftBan = async (req, res) => {
  try {
    const { liftedBy, liftReason } = req.body;
    const g = await prisma.guestBlacklist.update({
      where: { id: Number(req.params.id) },
      data: { status: 'LIFTED', liftedAt: new Date(), liftedBy: liftedBy || '', liftReason: liftReason || '' }
    });
    res.json(g);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteGuest = async (req, res) => {
  try {
    await prisma.guestBlacklist.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const [active, lifted, high, medium] = await Promise.all([
      prisma.guestBlacklist.count({ where: { status: 'ACTIVE' } }),
      prisma.guestBlacklist.count({ where: { status: 'LIFTED' } }),
      prisma.guestBlacklist.count({ where: { status: 'ACTIVE', severity: 'HIGH' } }),
      prisma.guestBlacklist.count({ where: { status: 'ACTIVE', severity: 'MEDIUM' } }),
    ]);
    res.json({ active, lifted, high, medium, low: active - high - medium });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.check = async (req, res) => {
  try {
    const { phone, name } = req.query;
    const where = { status: 'ACTIVE', OR: [] };
    if (phone) where.OR.push({ phone: { contains: phone } });
    if (name) where.OR.push({ guestName: { contains: name, mode: 'insensitive' } });
    if (!where.OR.length) return res.json({ flagged: false });
    const match = await prisma.guestBlacklist.findFirst({ where });
    res.json({ flagged: !!match, record: match });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
