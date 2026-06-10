const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/feedback  (public — no auth)
exports.submit = async (req, res) => {
  try {
    const { tableNo, orderId, customerName, foodRating, serviceRating, ambienceRating, comment, highlights } = req.body;
    if (!foodRating) return res.status(400).json({ message: 'foodRating required' });
    const overall = Math.round((
      (parseInt(foodRating) || 0) +
      (parseInt(serviceRating) || 0) +
      (parseInt(ambienceRating) || 0)
    ) / ([foodRating, serviceRating, ambienceRating].filter(Boolean).length || 1));

    const entry = await prisma.feedbackEntry.create({
      data: {
        tableNo: tableNo ? parseInt(tableNo) : null,
        orderId: orderId ? parseInt(orderId) : null,
        customerName: customerName || 'Anonymous',
        foodRating: parseInt(foodRating) || 0,
        serviceRating: parseInt(serviceRating) || 0,
        ambienceRating: parseInt(ambienceRating) || 0,
        overallRating: overall,
        comment: comment || '',
        highlights: highlights ? JSON.stringify(highlights) : '',
      },
    });
    res.json({ success: true, id: entry.id });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/feedback  (admin)
exports.getAll = async (req, res) => {
  try {
    const { status, rating } = req.query;
    const where = {};
    if (status) where.status = status;
    if (rating) where.overallRating = { gte: parseInt(rating) };
    const entries = await prisma.feedbackEntry.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(entries);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/feedback/:id/respond
exports.respond = async (req, res) => {
  try {
    const { response, respondedBy } = req.body;
    const entry = await prisma.feedbackEntry.update({
      where: { id: parseInt(req.params.id) },
      data: { response: response || '', respondedBy: respondedBy || '', status: 'RESPONDED', respondedAt: new Date() },
    });
    res.json(entry);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/feedback/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const entry = await prisma.feedbackEntry.update({
      where: { id: parseInt(req.params.id) },
      data: { status: req.body.status },
    });
    res.json(entry);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/feedback/summary  (admin)
exports.summary = async (req, res) => {
  try {
    const all = await prisma.feedbackEntry.findMany();
    const count = all.length;
    if (!count) return res.json({ count: 0, avgOverall: 0, avgFood: 0, avgService: 0, avgAmbience: 0, new: 0 });
    const avg = key => parseFloat((all.reduce((s, e) => s + (e[key] || 0), 0) / count).toFixed(1));
    // Rating distribution
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.forEach(e => { if (e.overallRating >= 1 && e.overallRating <= 5) dist[e.overallRating]++; });

    res.json({
      count,
      avgOverall: avg('overallRating'),
      avgFood: avg('foodRating'),
      avgService: avg('serviceRating'),
      avgAmbience: avg('ambienceRating'),
      new: all.filter(e => e.status === 'NEW').length,
      distribution: dist,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
