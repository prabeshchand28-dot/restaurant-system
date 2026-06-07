// routes/dashboard.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dashboardController');

router.get('/events',  ctrl.getEvents);
router.get('/summary', ctrl.getSummary);

module.exports = router;
