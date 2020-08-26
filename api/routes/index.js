const router = require('express').Router();

const author = require('./author');
const book = require('./book');
const genre = require('./genre');
const user = require('./user');
const review = require('./review');

router.use('/authors', author);
router.use('/books', book);
router.use('/genres', genre);
router.use('/users', user);
router.use('/reviews', review);

module.exports = router;
