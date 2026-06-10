const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/priceTierController');
const { verifyToken } = require('../middleware/auth');

router.get('/preview',  verifyToken, ctrl.preview);
router.get('/',         verifyToken, ctrl.getTiers);
router.post('/',        verifyToken, ctrl.createTier);
router.put('/:id',      verifyToken, ctrl.updateTier);
router.delete('/:id',   verifyToken, ctrl.deleteTier);

module.exports = router;
