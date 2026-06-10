const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/handoverController');

router.get('/',               auth, c.getAll);
router.get('/latest',         auth, c.getLatest);
router.post('/',              auth, c.create);
router.patch('/:id/ack',      auth, c.acknowledge);
router.delete('/:id',         auth, c.remove);

module.exports = router;
