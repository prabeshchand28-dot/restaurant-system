const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(promotions);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getActive = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5); // HH:MM
    const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];

    const all = await prisma.promotion.findMany({ where: { active: true } });
    const active = all.filter(p => {
      if (p.startDate && today < p.startDate) return false;
      if (p.endDate && today > p.endDate) return false;
      if (p.startTime && p.endTime) {
        if (time < p.startTime || time > p.endTime) return false;
      }
      if (p.days && p.days.length > 0) {
        const activeDays = p.days.split(',').map(d => d.trim());
        if (!activeDays.includes(day)) return false;
      }
      return true;
    });
    res.json(active);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, description, type, discountPct, discountAmt, startDate, endDate, startTime, endTime, days, applyTo, applyValue } = req.body;
    if (!name || !type) return res.status(400).json({ success: false, message: 'name and type required' });
    const promo = await prisma.promotion.create({
      data: {
        name, description: description||'', type,
        discountPct: parseInt(discountPct)||0,
        discountAmt: parseInt(discountAmt)||0,
        startDate: startDate||null, endDate: endDate||null,
        startTime: startTime||null, endTime: endTime||null,
        days: days||'',
        applyTo: applyTo||'all', applyValue: applyValue||'',
      },
    });
    res.json({ success: true, promo });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.toggle = async (req, res) => {
  try {
    const promo = await prisma.promotion.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!promo) return res.status(404).json({ success: false, message: 'Not found' });
    const updated = await prisma.promotion.update({ where: { id: promo.id }, data: { active: !promo.active } });
    res.json({ success: true, promo: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.promotion.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.calculateDiscount = async (req, res) => {
  try {
    const { orderAmount, category } = req.body;
    const active = await exports.getActivePromos();
    let totalDiscount = 0;
    const applied = [];
    for (const p of active) {
      if (p.applyTo === 'category' && category && !p.applyValue.includes(category)) continue;
      const disc = p.discountPct > 0
        ? Math.round(parseInt(orderAmount) * p.discountPct / 100)
        : p.discountAmt;
      totalDiscount += disc;
      applied.push({ name: p.name, discount: disc });
    }
    res.json({ totalDiscount, applied });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Internal helper
exports.getActivePromos = async () => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
  const all = await prisma.promotion.findMany({ where: { active: true } });
  return all.filter(p => {
    if (p.startDate && today < p.startDate) return false;
    if (p.endDate && today > p.endDate) return false;
    if (p.startTime && p.endTime && (time < p.startTime || time > p.endTime)) return false;
    if (p.days && p.days.length > 0 && !p.days.split(',').map(d=>d.trim()).includes(day)) return false;
    return true;
  });
};
