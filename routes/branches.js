const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/branchController');

router.get('/summary',       ctrl.getSummary);
router.get('/',              ctrl.getAll);
router.post('/',             ctrl.create);
router.patch('/:id',         ctrl.update);
router.patch('/:id/toggle',  ctrl.toggle);
router.delete('/:id',        ctrl.remove);

module.exports = router;
