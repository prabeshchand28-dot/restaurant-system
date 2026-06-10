const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/deliveryController');

router.get('/stats',              ctrl.getStats);
router.get('/zones',              ctrl.getZones);
router.post('/zones',             ctrl.createZone);
router.patch('/zones/:id',        ctrl.updateZone);
router.patch('/zones/:id/toggle', ctrl.toggleZone);
router.delete('/zones/:id',       ctrl.deleteZone);

router.get('/orders',             ctrl.getOrders);
router.post('/orders',            ctrl.createOrder);
router.patch('/orders/:id/status',ctrl.updateStatus);

module.exports = router;
