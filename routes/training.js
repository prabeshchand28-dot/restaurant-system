const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/trainingController');
const auth    = require('../middleware/auth');

router.get('/stats',          auth, ctrl.stats);
router.get('/modules',        auth, ctrl.getModules);
router.post('/modules',       auth, ctrl.createModule);
router.delete('/modules/:id', auth, ctrl.deleteModule);
router.get('/records',        auth, ctrl.getRecords);
router.post('/assign',        auth, ctrl.assign);
router.patch('/records/:id',  auth, ctrl.updateRecord);
module.exports = router;
