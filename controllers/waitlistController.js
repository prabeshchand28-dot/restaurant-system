const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getWaitlist = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    else where.status = 'WAITING'; // default: show active queue
    const entries = await prisma.waitlistEntry.findMany({
      where,
      orderBy: { addedAt: 'asc' },
    });
    res.json(entries);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const entries = await prisma.waitlistEntry.findMany({
      orderBy: { addedAt: 'desc' },
      take: 100,
    });
    res.json(entries);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addToWaitlist = async (req, res) => {
  try {
    const { customerName, phone, partySize, preference, estimatedWait, notes } = req.body;
    if (!customerName) return res.status(400).json({ message: 'Customer name required' });
    const entry = await prisma.waitlistEntry.create({
      data: {
        customerName,
        phone: phone || '',
        partySize: partySize ? Number(partySize) : 2,
        preference: preference || '',
        estimatedWait: estimatedWait ? Number(estimatedWait) : 15,
        notes: notes || '',
      },
    });
    res.status(201).json(entry);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['WAITING', 'NOTIFIED', 'SEATED', 'CANCELLED', 'NO_SHOW'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const data = { status };
    if (status === 'SEATED') data.seatedAt = new Date();
    if (status === 'NOTIFIED') data.notifiedAt = new Date();
    const entry = await prisma.waitlistEntry.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(entry);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateWait = async (req, res) => {
  try {
    const { estimatedWait } = req.body;
    const entry = await prisma.waitlistEntry.update({
      where: { id: Number(req.params.id) },
      data: { estimatedWait: Number(estimatedWait) },
    });
    res.json(entry);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteEntry = async (req, res) => {
  try {
    await prisma.waitlistEntry.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const [waiting, seated, noShow, cancelled] = await Promise.all([
      prisma.waitlistEntry.count({ where: { status: 'WAITING' } }),
      prisma.waitlistEntry.count({ where: { status: 'SEATED' } }),
      prisma.waitlistEntry.count({ where: { status: 'NO_SHOW' } }),
      prisma.waitlistEntry.count({ where: { status: 'CANCELLED' } }),
    ]);
    const avgWait = await prisma.waitlistEntry.aggregate({
      _avg: { estimatedWait: true },
      where: { status: 'WAITING' },
    });
    res.json({ waiting, seated, noShow, cancelled, avgWait: Math.round(avgWait._avg.estimatedWait || 0) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
