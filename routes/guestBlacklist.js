const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/guestBlacklistController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',       verifyToken, ctrl.stats);
router.get('/check',       verifyToken, ctrl.check);
router.get('/',            verifyToken, ctrl.getList);
router.post('/',           verifyToken, ctrl.addGuest);
router.patch('/:id/lift',  verifyToken, ctrl.liftBan);
router.delete('/:id',      verifyToken, ctrl.deleteGuest);

module.exports = router;
