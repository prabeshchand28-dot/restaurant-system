const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/loyaltyController');

router.get('/',                  ctrl.getAll);
router.get('/:phone',            ctrl.getByPhone);
router.post('/',                 ctrl.create);
router.post('/earn',             ctrl.earnPoints);
router.post('/redeem',           ctrl.redeemPoints);
router.post('/adjust',           ctrl.adjust);

module.exports = router;
