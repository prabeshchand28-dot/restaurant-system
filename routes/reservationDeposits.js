const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reservationDepositController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',      verifyToken, ctrl.stats);
router.get('/',           verifyToken, ctrl.getDeposits);
router.post('/',          verifyToken, ctrl.createDeposit);
router.patch('/:id',      verifyToken, ctrl.updateStatus);
router.delete('/:id',     verifyToken, ctrl.deleteDeposit);

module.exports = router;
