const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/clockController');

router.get('/',          auth, c.getAll);
router.get('/active',    auth, c.active);
router.get('/summary',   auth, c.summary);
router.post('/in',       auth, c.clockIn);
router.patch('/:id/out', auth, c.clockOut);
router.delete('/:id',    auth, c.remove);

module.exports = router;
