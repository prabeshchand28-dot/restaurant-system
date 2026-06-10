const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/prepChecklistController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, ctrl.stats);
router.get('/',      verifyToken, ctrl.getChecklists);
router.post('/',     verifyToken, ctrl.createChecklist);
router.put('/:id',   verifyToken, ctrl.updateChecklist);
router.delete('/:id', verifyToken, ctrl.deleteChecklist);

module.exports = router;
