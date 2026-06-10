const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/crmController');

router.get('/stats',       ctrl.getStats);
router.get('/',            ctrl.getAll);
router.get('/phone/:phone', ctrl.getByPhone);
router.get('/:id',         ctrl.getById);
router.post('/',           ctrl.create);
router.put('/:id',         ctrl.update);
router.post('/visit',      ctrl.recordVisit);
router.delete('/:id',      ctrl.remove);

module.exports = router;
