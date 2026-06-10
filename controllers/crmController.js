const prisma = require('../config/prisma');

function getSegment(visitCount, totalSpent) {
  if (totalSpent >= 10000 || visitCount >= 20) return 'VIP';
  if (visitCount === 0) return 'New';
  const daysSince = 0; // simplified
  return 'Regular';
}

exports.getAll = async (req, res) => {
  try {
    const customers = await prisma.customerProfile.findMany({ orderBy: { visitCount: 'desc' } });
    res.json(customers);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getByPhone = async (req, res) => {
  try {
    const c = await prisma.customerProfile.findUnique({ where: { phone: req.params.phone } });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json(c);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const c = await prisma.customerProfile.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json(c);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, email, birthday, allergyNotes, preferences, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'name and phone required' });
    const customer = await prisma.customerProfile.upsert({
      where: { phone },
      update: { name, email: email||'', birthday: birthday||'', allergyNotes: allergyNotes||'', preferences: preferences||'', notes: notes||'', updatedAt: new Date() },
      create: { name, phone, email: email||'', birthday: birthday||'', allergyNotes: allergyNotes||'', preferences: preferences||'', notes: notes||'' },
    });
    res.json({ success: true, customer });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, email, birthday, allergyNotes, preferences, notes, segment } = req.body;
    const customer = await prisma.customerProfile.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(birthday !== undefined && { birthday }),
        ...(allergyNotes !== undefined && { allergyNotes }),
        ...(preferences !== undefined && { preferences }),
        ...(notes !== undefined && { notes }),
        ...(segment && { segment }),
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, customer });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.recordVisit = async (req, res) => {
  try {
    const { phone, spent } = req.body;
    const c = await prisma.customerProfile.findUnique({ where: { phone } });
    if (!c) return res.status(404).json({ success: false, message: 'Customer not found' });
    const newVisits = c.visitCount + 1;
    const newSpent = c.totalSpent + (parseInt(spent) || 0);
    const segment = getSegment(newVisits, newSpent);
    const updated = await prisma.customerProfile.update({
      where: { phone },
      data: { visitCount: newVisits, totalSpent: newSpent, lastVisit: new Date(), segment, updatedAt: new Date() },
    });
    res.json({ success: true, customer: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const all = await prisma.customerProfile.findMany();
    const total = all.length;
    const vip = all.filter(c => c.segment === 'VIP').length;
    const newCust = all.filter(c => c.segment === 'New').length;
    const totalRevenue = all.reduce((s, c) => s + c.totalSpent, 0);
    const birthdays = all.filter(c => {
      if (!c.birthday) return false;
      const today = new Date().toISOString().slice(5, 10); // MM-DD
      return c.birthday === today;
    });
    res.json({ total, vip, new: newCust, totalRevenue, birthdaysToday: birthdays.length, birthdayCustomers: birthdays });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.customerProfile.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
