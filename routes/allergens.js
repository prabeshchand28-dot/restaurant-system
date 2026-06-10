const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/allergenController');
const { verifyToken } = require('../middleware/auth');

// Tags
router.get('/',                            verifyToken, ctrl.getTags);
router.post('/',                           verifyToken, ctrl.createTag);
router.put('/:id',                         verifyToken, ctrl.updateTag);
router.delete('/:id',                      verifyToken, ctrl.deleteTag);

// Menu items with tags (for the browsing view)
router.get('/menu',                        verifyToken, ctrl.getMenuWithTags);

// Per-item tag management
router.get('/item/:menuItemId',            verifyToken, ctrl.getItemTags);
router.put('/item/:menuItemId',            verifyToken, ctrl.setItemTags);
router.post('/item/:menuItemId',           verifyToken, ctrl.addItemTag);
router.delete('/item/:menuItemId/:tagId',  verifyToken, ctrl.removeItemTag);

module.exports = router;
