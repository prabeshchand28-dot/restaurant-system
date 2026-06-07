// routes/reports.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportController');

router.get('/summary',       ctrl.getSummary);
router.get('/orders-export', ctrl.exportOrders);

module.exports = router;
