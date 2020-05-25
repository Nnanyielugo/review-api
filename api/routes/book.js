const express = require('express');

const router = express.Router();
const book = require('../services/book');

router.get('/', book.list);
router.get('/:book', book.detail);
router.post('/', book.create);
router.patch('/:book', book.update);
router.delete('/:book', book.delete);

module.exports = router;
