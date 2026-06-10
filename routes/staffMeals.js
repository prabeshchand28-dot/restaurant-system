const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/staffMealController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats',   verifyToken, ctrl.stats);
router.get('/report',  verifyToken, ctrl.report);
router.get('/',        verifyToken, ctrl.getMeals);
router.post('/',       verifyToken, ctrl.logMeal);
router.delete('/:id',  verifyToken, ctrl.deleteMeal);

module.exports = router;
