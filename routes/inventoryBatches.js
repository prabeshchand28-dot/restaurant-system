const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/inventoryBatchController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',          verifyToken, ctrl.stats);
router.get('/',               verifyToken, ctrl.getBatches);
router.post('/',              verifyToken, ctrl.createBatch);
router.patch('/:id/consume',  verifyToken, ctrl.consume);
router.patch('/:id',          verifyToken, ctrl.updateStatus);
router.delete('/:id',         verifyToken, ctrl.deleteBatch);

module.exports = router;
