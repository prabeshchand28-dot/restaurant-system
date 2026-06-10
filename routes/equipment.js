const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/equipmentController');

router.get('/',        auth, c.getAll);
router.get('/stats',   auth, c.stats);
router.post('/',       auth, c.create);
router.patch('/:id',   auth, c.update);
router.delete('/:id',  auth, c.remove);

module.exports = router;
