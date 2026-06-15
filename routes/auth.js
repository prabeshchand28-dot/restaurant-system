// routes/auth.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');
const auth    = require('../middleware/auth');

router.post('/login',           ctrl.login);
router.post('/signup',          ctrl.signupRestaurant);
router.post('/change-password', auth, ctrl.changePassword);   // requires token
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/verify-otp',      ctrl.verifyOTP);
router.post('/reset-password',  ctrl.resetPassword);

module.exports = router;
