const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/auditController');

router.get('/stats', ctrl.getStats);
router.get('/',      ctrl.getAll);

module.exports = router;
