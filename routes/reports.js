// routes/reports.js
const express = require('express');
const router  = express.Router();
const { getDailySummary } = require('../services/reportService');

router.get('/summary', async (req, res) => {
  try {
    const data = await getDailySummary();
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
