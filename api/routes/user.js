const router = require('express').Router();
const auth = require('../middleware/auth');
const user = require('../services/user');

router.post('/', user.signup);
router.post('/login', user.login);
router.get('/:id', auth.optional, user.get);
router.patch('/:id', auth.required, user.update);
router.post('/:id/suspend', auth.required, user.suspend);

module.exports = router;
