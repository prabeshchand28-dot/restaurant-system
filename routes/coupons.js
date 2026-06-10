const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/couponController');

// Coupons
router.get('/',                   ctrl.getAll);
router.post('/',                  ctrl.create);
router.post('/validate',          ctrl.validate);
router.post('/use',               ctrl.use);
router.patch('/:id/toggle',       ctrl.toggle);
router.delete('/:id',             ctrl.remove);

// Gift Cards
router.get('/gift-cards',         ctrl.getAllGiftCards);
router.post('/gift-cards',        ctrl.createGiftCard);
router.post('/gift-cards/validate', ctrl.validateGiftCard);
router.post('/gift-cards/use',    ctrl.useGiftCard);

module.exports = router;
