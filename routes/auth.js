// routes/auth.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');

router.post('/login',           ctrl.login);
router.post('/change-password', ctrl.changePassword);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/verify-otp',      ctrl.verifyOTP);
router.post('/reset-password',  ctrl.resetPassword);

module.exports = router;
