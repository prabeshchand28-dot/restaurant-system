// routes/payments.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paymentController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/',        ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.post('/',       authMiddleware, roleMiddleware('admin', 'manager'), ctrl.process);

module.exports = router;
