const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/menuEngineeringController');
const auth    = require('../middleware/auth');

router.get('/', auth, ctrl.getMatrix);

module.exports = router;
