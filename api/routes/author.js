const express = require('express');

const router = express.Router();
const author = require('../services/author');

router.get('/', author.list);
router.post('/', author.create);
router.get('/:id', author.detail);
router.patch('/:id', author.update);
router.delete('/:id', author.delete);

module.exports = router;
