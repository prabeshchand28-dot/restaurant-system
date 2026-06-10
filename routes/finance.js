const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/financeController');

router.get('/pl',         ctrl.getPL);
router.get('/cashflow',   ctrl.getCashFlow);
router.get('/analytics',  ctrl.getRevenueAnalytics);
router.get('/export',     ctrl.exportCSV);

module.exports = router;
