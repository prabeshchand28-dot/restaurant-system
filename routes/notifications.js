const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/notificationController');

router.get('/events',              ctrl.getEvents);
router.get('/stats',               ctrl.getStats);

router.get('/templates',           ctrl.getTemplates);
router.post('/templates',          ctrl.createTemplate);
router.patch('/templates/:id',     ctrl.updateTemplate);
router.patch('/templates/:id/toggle', ctrl.toggleTemplate);
router.delete('/templates/:id',    ctrl.deleteTemplate);

router.get('/logs',                ctrl.getLogs);
router.post('/send',               ctrl.sendTest);

module.exports = router;
