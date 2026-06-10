const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/payrollController');

router.get('/rates',      ctrl.getPayRates);
router.post('/rates',     ctrl.setPayRate);
router.get('/summary',    ctrl.getSummary);
router.get('/',           ctrl.getAll);
router.post('/generate',  ctrl.generate);
router.put('/:id',        ctrl.updatePayroll);

module.exports = router;
