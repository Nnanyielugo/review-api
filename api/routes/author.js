const express = require('express');

const router = express.Router();
const author = require('../services/author');

router.get('/', author.author_list);
router.post('/', author.author_create_post);
router.get('/:id', author.author_detail);
router.delete('/:id', author.author_delete_post);
router.patch('/:id', author.author_update_post);

module.exports = router;
