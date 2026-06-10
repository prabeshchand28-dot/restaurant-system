const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/tableHygieneController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',   verifyToken, ctrl.stats);
router.get('/board',   verifyToken, ctrl.statusBoard);
router.get('/',        verifyToken, ctrl.getLogs);
router.post('/',       verifyToken, ctrl.logCleaning);
router.delete('/:id',  verifyToken, ctrl.deleteLog);

module.exports = router;
