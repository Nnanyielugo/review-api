const router = require('express').Router();
const auth = require('../middleware/auth');
const user = require('../services/user');

router.get('/user', auth.required, user.get);
router.post('/', user.signup);
router.post('/login', user.login);
router.patch('/user', auth.required, user.update);

module.exports = router;
