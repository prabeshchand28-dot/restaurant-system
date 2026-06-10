const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/analyticsController');

router.get('/revenue-trend',      ctrl.revenueTrend);
router.get('/peak-hours',         ctrl.peakHours);
router.get('/best-sellers',       ctrl.bestSellers);
router.get('/category-breakdown', ctrl.categoryBreakdown);
router.get('/customer-metrics',   ctrl.customerMetrics);
router.get('/daily-sales',        ctrl.dailySales);

module.exports = router;
