const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/staffAdvanceController');

router.get('/',             auth, c.getAll);
router.get('/stats',        auth, c.stats);
router.post('/',            auth, c.create);
router.post('/:id/repay',   auth, c.repay);
router.delete('/:id',       auth, c.remove);

module.exports = router;
