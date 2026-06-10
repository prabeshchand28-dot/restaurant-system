const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/eventController');
const auth    = require('../middleware/auth');

router.get('/stats',  auth, ctrl.stats);
router.get('/',       auth, ctrl.getAll);
router.get('/:id',    auth, ctrl.getOne);
router.post('/',      auth, ctrl.create);
router.patch('/:id',  auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
