const router = require('express').Router();
const auth = require('../middleware/auth');
const user = require('../services/user');

router.post('/', user.signup);
router.post('/login', user.login);
router.get('/user', auth.required, user.get);
router.patch('/user', auth.required, user.update);
router.post('/user/suspend', auth.required, user.suspend);

module.exports = router;
