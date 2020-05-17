const express = require('express');

const router = express.Router();
const book = require('../services/book');

router.get('/', book.book_list);
router.get('/:id', book.book_detail);
router.post('/', book.book_create_post);
router.patch('/:id', book.book_update_post);
router.delete('/:id', book.book_delete_post);

module.exports = router;
