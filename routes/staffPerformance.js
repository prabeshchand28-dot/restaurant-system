const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/staffPerformanceController');

router.get('/leaderboard',   ctrl.getLeaderboard);
router.get('/logs',          ctrl.getLogs);
router.get('/:id',           ctrl.getStaffDetail);
router.post('/log',          ctrl.logPerformance);

module.exports = router;
