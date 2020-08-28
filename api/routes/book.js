const router = require('express').Router();
const book = require('../services/book');
const auth = require('../middleware/auth');

router.get('/', auth.optional, book.list);
router.post('/', auth.required, book.create);
router.get('/:book', auth.optional, book.detail);
router.patch('/:book', auth.required, book.update);
router.delete('/:book', auth.required, book.delete);

module.exports = router;
