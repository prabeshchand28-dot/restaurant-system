// routes/menu.js
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/menuController');
const { makeUpload } = require('../middleware/upload');
const upload   = makeUpload('menu');

router.get('/',        ctrl.getAll);
router.get('/:id',     ctrl.getById);
router.post('/',       upload.single('image'), ctrl.create);
router.put('/:id',     upload.single('image'), ctrl.update);
router.delete('/:id',  ctrl.remove);

module.exports = router;
