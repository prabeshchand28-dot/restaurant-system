const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/closingReportController');

router.get('/generate',   ctrl.generate);
router.get('/history',    ctrl.getAll);
router.get('/:date',      ctrl.getOne);
router.post('/',          ctrl.save);

module.exports = router;
