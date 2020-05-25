const express = require('express');

const router = express.Router();
const genre = require('../services/genre');

router.get('/', genre.list);
router.get('/:genre', genre.detail);
router.post('/', genre.create);
router.patch('/:genre', genre.update);
router.delete('/:genre', genre.delete);

module.exports = router;
