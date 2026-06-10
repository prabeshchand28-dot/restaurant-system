const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/nightAuditController');
const { verifyToken } = require('../middleware/auth');

router.get('/today',   verifyToken, ctrl.getToday);
router.get('/summary', verifyToken, ctrl.summary);
router.get('/',        verifyToken, ctrl.getAudits);
router.post('/',       verifyToken, ctrl.upsertAudit);
router.delete('/:id',  verifyToken, ctrl.deleteAudit);

module.exports = router;
