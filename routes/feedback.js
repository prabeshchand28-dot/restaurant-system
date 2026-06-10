const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/feedbackController');
const auth    = require('../middleware/auth');

// Public (no auth)
router.post('/', ctrl.submit);

// Admin
router.get('/summary',        auth, ctrl.summary);
router.get('/',               auth, ctrl.getAll);
router.patch('/:id/respond',  auth, ctrl.respond);
router.patch('/:id/status',   auth, ctrl.updateStatus);

module.exports = router;
