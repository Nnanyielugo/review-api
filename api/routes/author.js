const router = require('express').Router();
const author = require('../services/author');
const auth = require('../middleware/auth');

router.param('author', author.preloadAuthor);
router.get('/', auth.optional, author.list);
router.post('/', auth.required, author.create);
router.get('/:id', auth.optional, author.detail);
router.patch('/:id', auth.required, author.update);
router.delete('/:id', auth.required, author.delete);

module.exports = router;
