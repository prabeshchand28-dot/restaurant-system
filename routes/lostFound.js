const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/lostFoundController');

router.get('/',           auth, c.getAll);
router.post('/',          auth, c.create);
router.patch('/:id/claim',auth, c.claim);
router.patch('/:id',      auth, c.update);
router.delete('/:id',     auth, c.remove);

module.exports = router;
