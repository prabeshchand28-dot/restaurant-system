const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/invoiceController');
const auth    = require('../middleware/auth');

router.get('/stats',  auth, ctrl.stats);
router.get('/',       auth, ctrl.getAll);
router.post('/',      auth, ctrl.create);
router.patch('/:id',  auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
