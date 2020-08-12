const router = require('express').Router();
const genre = require('../services/genre');
const auth = require('../middleware/auth');

router.get('/', auth.optional, genre.list);
router.get('/:genre', auth.optional, genre.detail);
router.post('/', auth.required, genre.create);
router.patch('/:genre', auth.required, genre.update);
router.delete('/:genre', auth.required, genre.delete);

module.exports = router;
