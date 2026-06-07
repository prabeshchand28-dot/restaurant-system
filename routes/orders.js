// routes/orders.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');

router.get('/',                    ctrl.getAll);
router.get('/stats',               ctrl.getStats);
router.get('/table/:t',            ctrl.getByTable);
router.get('/:id',                 ctrl.getById);
router.post('/',                   ctrl.create);
router.patch('/:id/status',        ctrl.updateStatus);
router.put('/:id',                 ctrl.update);
router.delete('/:id',              ctrl.remove);
router.post('/:id/call-bell',      ctrl.callBell);

module.exports = router;
