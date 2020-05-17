const express = require('express');

const router = express.Router();
const book = require('../services/book');

router.get('/', book.list);
router.get('/:id', book.detail);
router.post('/', book.create);
router.patch('/:id', book.update);
router.delete('/:id', book.delete);

module.exports = router;
