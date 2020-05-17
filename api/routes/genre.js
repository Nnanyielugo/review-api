const express = require('express');

const router = express.Router();
const genre = require('../services/genre');

router.get('/', genre.genre_list);
router.get('/:id', genre.genre_detail);
router.post('/', genre.genre_create_post);
router.delete('/:id', genre.genre_delete_post);
router.patch('/:id', genre.genre_update_post);

module.exports = router;
