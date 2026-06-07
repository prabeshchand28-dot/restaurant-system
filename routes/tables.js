// routes/tables.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/tableController');

router.get('/',           ctrl.getAll);
router.post('/',          ctrl.create);
router.delete('/:no',     ctrl.remove);
router.get('/:no/qr',     ctrl.getQR);

module.exports = router;
