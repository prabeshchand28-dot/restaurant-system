const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/rosterController');
const auth    = require('../middleware/auth');

router.get('/',           auth, ctrl.getWeek);
router.post('/',          auth, ctrl.upsert);
router.post('/publish',   auth, ctrl.publish);
router.post('/copy',      auth, ctrl.copyWeek);
router.delete('/:id',     auth, ctrl.remove);

module.exports = router;
