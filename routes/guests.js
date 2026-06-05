// routes/guests.js
const express = require('express');
const router  = express.Router();
const prisma  = require('../config/prisma');

// GET /api/guests
router.get('/', async (req, res) => {
  const guests = await prisma.guest.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(guests.map(g => ({
    id: g.id, table: g.tableNum, count: g.count,
    gender: g.gender, time: g.createdAt,
  })));
});

// POST /api/guests
router.post('/', async (req, res) => {
  try {
    const { table, count, gender } = req.body;
    if (!table || !count || !gender)
      return res.status(400).json({ success: false, message: 'table, count, gender required' });

    const tableRec = await prisma.restaurantTable.findUnique({ where: { number: parseInt(table) } });

    const guest = await prisma.guest.create({
      data: {
        tableNum: parseInt(table),
        tableId:  tableRec?.id || null,
        count:    parseInt(count),
        gender,
      },
    });
    res.json({ success: true, guest: { id: guest.id, table: guest.tableNum, count: guest.count, gender: guest.gender, time: guest.createdAt } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
