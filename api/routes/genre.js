const express = require('express');

const router = express.Router();
const genre = require('../services/genre');

router.get('/', genre.list);
router.get('/:id', genre.detail);
router.post('/', genre.create);
router.patch('/:id', genre.update);
router.delete('/:id', genre.delete);

module.exports = router;
