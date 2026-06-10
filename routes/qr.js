const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/qrController');

router.get('/tables',        ctrl.getTableQRs);
router.get('/table/:table',  ctrl.getTableQR);
router.get('/wifi',          ctrl.getWifiQR);

module.exports = router;
