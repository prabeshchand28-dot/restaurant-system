const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/walletController');

// Wallet
router.get('/wallets',              ctrl.getAll);
router.get('/wallets/:phone',       ctrl.getByPhone);
router.post('/wallets',             ctrl.create);
router.post('/wallets/topup',       ctrl.topUp);
router.post('/wallets/spend',       ctrl.spend);

// Membership
router.get('/memberships/tiers',                ctrl.getMembershipTiers);
router.get('/memberships',                      ctrl.getAllMemberships);
router.get('/memberships/:phone',               ctrl.getMembershipByPhone);
router.post('/memberships',                     ctrl.createMembership);

module.exports = router;
