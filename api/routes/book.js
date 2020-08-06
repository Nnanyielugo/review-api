const router = require('express').Router();
const book = require('../services/book');
const auth = require('../middleware/auth');

router.get('/', auth.optional, book.list);
router.get('/:book', auth.optional, book.detail);
router.post('/', auth.required, book.create);
router.patch('/:book', auth.required, book.update);
router.delete('/:book', auth.required, book.delete);

module.exports = router;
