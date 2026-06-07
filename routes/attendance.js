// routes/attendance.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/attendanceController');

router.get('/',           ctrl.getAll);
router.get('/report',     ctrl.getReport);
router.post('/checkin',   ctrl.checkIn);
router.post('/checkout',  ctrl.checkOut);
router.patch('/:userId',  ctrl.update);

module.exports = router;
