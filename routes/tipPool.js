const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/tipPoolController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',          verifyToken, ctrl.stats);
router.get('/',               verifyToken, ctrl.getPools);
router.post('/',              verifyToken, ctrl.createPool);
router.patch('/:id/distribute', verifyToken, ctrl.distribute);
router.delete('/:id',         verifyToken, ctrl.deletePool);

module.exports = router;
