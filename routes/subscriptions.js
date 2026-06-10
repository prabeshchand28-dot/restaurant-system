const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/subscriptionController');

router.get('/plans',             auth, c.getPlans);
router.post('/plans',            auth, c.createPlan);
router.patch('/plans/:id',       auth, c.updatePlan);
router.delete('/plans/:id',      auth, c.deletePlan);
router.get('/',                  auth, c.getSubscriptions);
router.get('/stats',             auth, c.stats);
router.post('/',                 auth, c.subscribe);
router.patch('/:id',             auth, c.updateSubscription);

module.exports = router;
