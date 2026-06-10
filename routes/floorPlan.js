const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/floorPlanController');
const { verifyToken } = require('../middleware/auth');

router.get('/',        verifyToken, ctrl.getPlans);
router.get('/:id',     verifyToken, ctrl.getPlan);
router.post('/',       verifyToken, ctrl.createPlan);
router.put('/:id',     verifyToken, ctrl.savePlan);
router.delete('/:id',  verifyToken, ctrl.deletePlan);

module.exports = router;
