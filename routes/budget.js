const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/budgetController');
const auth    = require('../middleware/auth');

router.get('/trend', auth, ctrl.trend);
router.get('/',      auth, ctrl.getMonth);
router.post('/',     auth, ctrl.upsert);
module.exports = router;
