const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/events?status=&month=
exports.getAll = async (req, res) => {
  try {
    const { status, month } = req.query;
    const where = {};
    if (status) where.status = status;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.eventDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }
    const events = await prisma.event.findMany({ where, include: { items: true }, orderBy: { eventDate: 'asc' } });
    res.json(events);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/events/:id
exports.getOne = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: parseInt(req.params.id) }, include: { items: true } });
    if (!event) return res.status(404).json({ message: 'Not found' });
    res.json(event);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/events
exports.create = async (req, res) => {
  try {
    const { name, type, clientName, clientPhone, clientEmail, eventDate, startTime, endTime, venue, guestCount, notes, items } = req.body;
    if (!name || !clientName || !eventDate) return res.status(400).json({ message: 'name, clientName, eventDate required' });

    const itemData = (items || []).map(i => ({
      description: i.description,
      quantity: parseInt(i.quantity) || 1,
      unitPrice: parseFloat(i.unitPrice) || 0,
      total: (parseInt(i.quantity) || 1) * (parseFloat(i.unitPrice) || 0),
    }));
    const totalAmount = itemData.reduce((s, i) => s + i.total, 0);

    const event = await prisma.event.create({
      data: {
        name, type: type || 'PRIVATE',
        clientName, clientPhone: clientPhone || '',
        clientEmail: clientEmail || '',
        eventDate: new Date(eventDate),
        startTime: startTime || '', endTime: endTime || '',
        venue: venue || '',
        guestCount: parseInt(guestCount) || 0,
        totalAmount, notes: notes || '',
        items: { create: itemData },
      },
      include: { items: true },
    });
    res.json(event);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/events/:id
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, depositPaid, notes, guestCount } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (depositPaid !== undefined) data.depositPaid = parseFloat(depositPaid);
    if (notes !== undefined) data.notes = notes;
    if (guestCount !== undefined) data.guestCount = parseInt(guestCount);
    const event = await prisma.event.update({ where: { id }, data, include: { items: true } });
    res.json(event);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/events/:id
exports.remove = async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/events/stats
exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [total, upcoming, thisMonthCount, confirmed] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { eventDate: { gte: now }, status: { not: 'CANCELLED' } } }),
      prisma.event.count({ where: { eventDate: { gte: thisMonth } } }),
      prisma.event.count({ where: { status: 'CONFIRMED' } }),
    ]);
    const revenue = await prisma.event.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ['COMPLETED', 'DEPOSIT_PAID'] } } });
    res.json({ total, upcoming, thisMonthCount, confirmed, totalRevenue: revenue._sum.totalAmount || 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
