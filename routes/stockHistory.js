const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/stockHistoryController');

router.get('/summary',               ctrl.getSummary);
router.get('/low-stock',             ctrl.getLowStock);
router.get('/history',               ctrl.getHistory);
router.post('/adjust',               ctrl.adjust);
router.patch('/reorder/:id',         ctrl.setReorderPoint);

module.exports = router;
