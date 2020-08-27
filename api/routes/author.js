const router = require('express').Router();
const author = require('../services/author');
const auth = require('../middleware/auth');

router.param('author', author.preloadAuthor);
router.get('/', auth.optional, author.list);
router.post('/', auth.required, author.create);
router.get('/:author', auth.optional, author.detail);
router.patch('/:author', auth.required, author.update);
router.delete('/:author', auth.required, author.delete);

module.exports = router;
