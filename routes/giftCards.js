const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/giftCardController');

router.get('/',              auth, c.getAll);
router.get('/stats',         auth, c.stats);
router.get('/check/:code',   c.getByCode);   // public
router.post('/issue',        auth, c.issue);
router.post('/redeem',       auth, c.redeem);
router.post('/:id/reload',   auth, c.reload);
router.patch('/:id/void',    auth, c.voidCard);

module.exports = router;
