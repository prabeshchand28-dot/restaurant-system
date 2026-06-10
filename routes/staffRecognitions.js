const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/staffRecognitionController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, ctrl.stats);
router.get('/',      verifyToken, ctrl.getNominations);
router.post('/',     verifyToken, ctrl.nominate);
router.patch('/:id/approve', verifyToken, ctrl.approve);
router.delete('/:id', verifyToken, ctrl.deleteNomination);

module.exports = router;
