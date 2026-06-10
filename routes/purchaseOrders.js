const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/purchaseOrderController');

router.get('/',            auth, c.getAll);
router.get('/stats',       auth, c.stats);
router.get('/:id',         auth, c.getOne);
router.post('/',           auth, c.create);
router.patch('/:id/status',auth, c.updateStatus);
router.post('/:id/receive',auth, c.receive);
router.delete('/:id',      auth, c.remove);

module.exports = router;
