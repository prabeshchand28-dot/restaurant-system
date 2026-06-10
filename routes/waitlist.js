const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/waitlistController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',    verifyToken, ctrl.stats);
router.get('/all',      verifyToken, ctrl.getAll);
router.get('/',         verifyToken, ctrl.getWaitlist);
router.post('/',        verifyToken, ctrl.addToWaitlist);
router.patch('/:id/status', verifyToken, ctrl.updateStatus);
router.patch('/:id/wait',   verifyToken, ctrl.updateWait);
router.delete('/:id',   verifyToken, ctrl.deleteEntry);

module.exports = router;
