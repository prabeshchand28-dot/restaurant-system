const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/onlineOrderController');

// Public (no auth needed)
router.get('/public/menu',          ctrl.getPublicMenu);
router.post('/public/order',        ctrl.placeOrder);
router.get('/public/track/:id',     ctrl.trackOrder);

// Admin
router.get('/stats',                ctrl.getStats);
router.get('/',                     ctrl.getAll);
router.patch('/:id/status',         ctrl.updateStatus);

module.exports = router;
