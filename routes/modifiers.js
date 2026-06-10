const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/modifierController');

router.get('/',                          auth, c.getAll);
router.get('/item/:itemId',              c.getForItem);  // public (used by order page)
router.post('/',                         auth, c.createGroup);
router.patch('/:id',                     auth, c.updateGroup);
router.delete('/:id',                    auth, c.deleteGroup);
router.post('/:groupId/options',         auth, c.addOption);
router.patch('/options/:optionId',       auth, c.updateOption);
router.delete('/options/:optionId',      auth, c.deleteOption);

module.exports = router;
