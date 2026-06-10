const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/leaveController');

router.get('/summary',   ctrl.getSummary);
router.get('/',          ctrl.getAll);
router.post('/',         ctrl.create);
router.patch('/:id',     ctrl.review);
router.delete('/:id',    ctrl.remove);

module.exports = router;
