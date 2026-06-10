const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/supplierController');

// Suppliers
router.get('/',               ctrl.getAll);
router.post('/',              ctrl.create);
router.put('/:id',            ctrl.update);
router.delete('/:id',         ctrl.remove);

// Purchase Orders
router.get('/purchase-orders',         ctrl.getAllPO);
router.post('/purchase-orders',        ctrl.createPO);
router.patch('/purchase-orders/:id',   ctrl.updatePOStatus);

module.exports = router;
