const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/menuCategoryController');
const { verifyToken } = require('../middleware/auth');

router.get('/',            verifyToken, ctrl.getCategories);
router.post('/',           verifyToken, ctrl.createCategory);
router.post('/reorder',    verifyToken, ctrl.reorder);
router.put('/:id',         verifyToken, ctrl.updateCategory);
router.delete('/:id',      verifyToken, ctrl.deleteCategory);

module.exports = router;
