const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/menu86Controller');
const { verifyToken } = require('../middleware/auth');

router.get('/board',       verifyToken, ctrl.get86Board);
router.get('/menu',        verifyToken, ctrl.getMenuWithAvailability);
router.post('/toggle',     verifyToken, ctrl.toggleItem);
router.patch('/:id/restore', verifyToken, ctrl.restore);

module.exports = router;
