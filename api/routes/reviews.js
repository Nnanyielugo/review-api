const router = require('express').Router();
const reviews = require('../services/review');
const auth = require('../middleware/auth');

router.get('/', auth.optional, reviews.list);
router.get('/review', auth.optional, reviews.get);
router.post('/', auth.required, reviews.create);
router.patch('/:review', auth.required, reviews.update);
router.delete('/:review', auth.required, reviews.delete);

module.exports = router;
