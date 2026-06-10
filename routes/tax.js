const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/taxController');

router.get('/report',        ctrl.getReport);
router.post('/calculate',    ctrl.calculate);
router.get('/',              ctrl.getAll);
router.post('/',             ctrl.create);
router.patch('/:id',         ctrl.update);
router.patch('/:id/toggle',  ctrl.toggle);
router.delete('/:id',        ctrl.remove);

module.exports = router;
