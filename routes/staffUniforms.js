const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/staffUniformController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, ctrl.stats);
router.get('/',      verifyToken, ctrl.getUniforms);
router.post('/',     verifyToken, ctrl.issueUniform);
router.patch('/:id/return', verifyToken, ctrl.returnUniform);
router.delete('/:id', verifyToken, ctrl.deleteUniform);

module.exports = router;
