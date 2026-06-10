const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/campaignController');

router.get('/stats',       ctrl.getStats);
router.get('/preview',     ctrl.getPreview);
router.get('/',            ctrl.getAll);
router.post('/',           ctrl.create);
router.post('/:id/send',   ctrl.send);
router.delete('/:id',      ctrl.remove);

module.exports = router;
