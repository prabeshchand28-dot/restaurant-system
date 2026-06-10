const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/incidentLogController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, ctrl.stats);
router.get('/',      verifyToken, ctrl.getIncidents);
router.post('/',     verifyToken, ctrl.createIncident);
router.patch('/:id', verifyToken, ctrl.updateIncident);
router.delete('/:id', verifyToken, ctrl.deleteIncident);

module.exports = router;
