// routes/ratings.js
const express = require('express');
const router  = express.Router();
const prisma  = require('../config/prisma');

router.get('/', async (req, res) => {
  const ratings = await prisma.rating.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(ratings);
});

router.post('/', async (req, res) => {
  try {
    const { table, orderId, overall, food, service, comment } = req.body;
    if (!table || !overall)
      return res.status(400).json({ success: false, message: 'table and overall rating required' });

    const rating = await prisma.rating.create({
      data: {
        tableNum: parseInt(table),
        orderId:  orderId ? parseInt(orderId) : null,
        overall:  parseInt(overall),
        food:     parseInt(food || overall),
        service:  parseInt(service || overall),
        comment:  comment || '',
      },
    });
    res.json({ success: true, rating });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
