const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/disciplinaryController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',           verifyToken, ctrl.stats);
router.get('/staff/:staffId',  verifyToken, ctrl.getStaffHistory);
router.get('/',                verifyToken, ctrl.getRecords);
router.post('/',               verifyToken, ctrl.createRecord);
router.patch('/:id',           verifyToken, ctrl.updateStatus);
router.delete('/:id',          verifyToken, ctrl.deleteRecord);

module.exports = router;
