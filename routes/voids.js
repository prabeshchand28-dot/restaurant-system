const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/voidController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',       verifyToken, ctrl.stats);
router.get('/',            verifyToken, ctrl.getVoids);
router.post('/',           verifyToken, ctrl.createVoid);
router.patch('/:id/approve', verifyToken, ctrl.approve);
router.patch('/:id/reject',  verifyToken, ctrl.reject);
router.delete('/:id',      verifyToken, ctrl.deleteVoid);

module.exports = router;
