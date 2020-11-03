const router = require('express').Router();
const genres = require('../services/genre');
const auth = require('../middleware/auth');

router.param('genre', genres.preloadGenre);
router.get('/', auth.optional, genres.list);
router.get('/:genre', auth.optional, genres.detail);
router.post('/', auth.required, genres.create);
router.patch('/:genre', auth.required, genres.update);
router.delete('/:genre', auth.required, genres.delete);

module.exports = router;
