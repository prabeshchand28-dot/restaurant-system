const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/commissionController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',       verifyToken, ctrl.stats);
router.get('/periods',     verifyToken, ctrl.getPeriods);
router.get('/',            verifyToken, ctrl.getCommissions);
router.post('/',           verifyToken, ctrl.upsertCommission);
router.patch('/:id/approve', verifyToken, ctrl.approve);
router.patch('/:id/paid',    verifyToken, ctrl.markPaid);
router.delete('/:id',      verifyToken, ctrl.deleteCommission);

module.exports = router;
