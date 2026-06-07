// routes/kitchen.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/kitchenController');

router.get('/orders',              ctrl.getOrders);
router.patch('/orders/:id/status', ctrl.updateStatus);
router.get('/stats',               ctrl.getStats);

module.exports = router;
