const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/birthdayController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',        verifyToken, ctrl.stats);
router.get('/upcoming',     verifyToken, ctrl.getUpcoming);
router.get('/',             verifyToken, ctrl.getAll);
router.post('/',            verifyToken, ctrl.create);
router.patch('/:id/offer',  verifyToken, ctrl.sendOffer);
router.patch('/:id',        verifyToken, ctrl.update);
router.delete('/:id',       verifyToken, ctrl.deleteRecord);

module.exports = router;
