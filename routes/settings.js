// routes/settings.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/settingsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/',         ctrl.getAll);
router.get('/:key',     ctrl.getOne);
router.post('/',        authMiddleware, roleMiddleware('admin','manager'), ctrl.set);

module.exports = router;
