const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Upcoming birthdays within N days
exports.getUpcoming = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const all = await prisma.customerBirthday.findMany({ orderBy: { createdAt: 'desc' } });
    const today = new Date();
    const upcoming = all.filter(b => {
      const bd = new Date(b.birthDate);
      // Normalize to this year's birthday
      const thisYearBday = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
      const diff = Math.round((thisYearBday - today) / 86400000);
      return diff <= days && diff >= 0;
    }).map(b => {
      const bd = new Date(b.birthDate);
      const thisYearBday = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
      return { ...b, daysUntil: Math.round((thisYearBday - today) / 86400000), nextBirthday: thisYearBday };
    });
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    res.json(upcoming);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const { month, search } = req.query;
    let all = await prisma.customerBirthday.findMany({ orderBy: { customerName: 'asc' } });
    if (month) all = all.filter(b => new Date(b.birthDate).getMonth() + 1 === Number(month));
    if (search) all = all.filter(b => b.customerName.toLowerCase().includes(search.toLowerCase()) || b.phone.includes(search));
    res.json(all);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { customerName, phone, email, birthDate, notes } = req.body;
    if (!customerName || !birthDate) return res.status(400).json({ message: 'Name and birth date required' });
    const b = await prisma.customerBirthday.create({
      data: { customerName, phone: phone || '', email: email || '', birthDate: new Date(birthDate), notes: notes || '' },
    });
    res.status(201).json(b);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.sendOffer = async (req, res) => {
  try {
    const { offerCode } = req.body;
    const code = offerCode || `BDAY-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
    const b = await prisma.customerBirthday.update({
      where: { id: Number(req.params.id) },
      data: { offerSent: true, offerSentAt: new Date(), offerCode: code, updatedAt: new Date() },
    });
    res.json(b);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const b = await prisma.customerBirthday.update({
      where: { id: Number(req.params.id) },
      data: { ...req.body, updatedAt: new Date() },
    });
    res.json(b);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteRecord = async (req, res) => {
  try {
    await prisma.customerBirthday.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.stats = async (req, res) => {
  try {
    const today = new Date();
    const all = await prisma.customerBirthday.findMany();
    const todayBdays = all.filter(b => {
      const bd = new Date(b.birthDate);
      return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
    });
    const thisMonth = all.filter(b => new Date(b.birthDate).getMonth() === today.getMonth());
    const offersSent = all.filter(b => b.offerSent).length;
    res.json({ total: all.length, today: todayBdays.length, thisMonth: thisMonth.length, offersSent });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
