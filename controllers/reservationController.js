// controllers/reservationController.js
const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  const rows = await prisma.reservation.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(rows);
};

exports.create = async (req, res) => {
  try {
    const { name, phone, guests, date, time, tableNo, note } = req.body;
    if (!name || !phone || !guests || !date || !time)
      return res.status(400).json({ success: false, message: 'All fields required' });
    const tableRec = tableNo ? await prisma.restaurantTable.findUnique({ where: { number: parseInt(tableNo) } }) : null;
    const reservation = await prisma.reservation.create({
      data: { name, phone, guests: parseInt(guests), date, time, tableNo: tableNo ? parseInt(tableNo) : null, tableId: tableRec?.id || null, note: note || '', status: 'Confirmed' },
    });
    res.json({ success: true, reservation });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const r = await prisma.reservation.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json({ success: true, reservation: r });
  } catch (e) { res.status(404).json({ success: false, message: 'Reservation not found' }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.reservation.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(404).json({ success: false, message: 'Reservation not found' }); }
};
