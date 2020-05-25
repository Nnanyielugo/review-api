const express = require('express');

const router = express.Router();
const author = require('../services/author');

router.get('/', author.list);
router.post('/', author.create);
router.get('/:author', author.detail);
router.patch('/:author', author.update);
router.delete('/:author', author.delete);

module.exports = router;
