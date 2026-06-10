const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/tipController');
const auth    = require('../middleware/auth');

router.get('/summary', auth, ctrl.summary);
router.get('/',        auth, ctrl.getAll);
router.post('/',       auth, ctrl.create);
router.post('/:id/distribute', auth, ctrl.distribute);
router.delete('/:id',  auth, ctrl.remove);
module.exports = router;
