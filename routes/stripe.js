const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/stripeController');

router.get('/settings',           ctrl.getSettings);
router.post('/settings',          ctrl.saveSettings);
router.post('/create-session',    ctrl.createSession);
router.post('/webhook',           express.raw({ type: 'application/json' }), ctrl.webhook);
router.post('/esewa/initiate',    ctrl.esewaInitiate);

module.exports = router;
