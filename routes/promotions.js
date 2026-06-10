const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/promotionController');

router.get('/active',          ctrl.getActive);
router.get('/',                ctrl.getAll);
router.post('/',               ctrl.create);
router.post('/calculate',      ctrl.calculateDiscount);
router.patch('/:id/toggle',    ctrl.toggle);
router.delete('/:id',          ctrl.remove);

module.exports = router;
