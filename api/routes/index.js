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

// handle validation error messages
//    TODO: verify
router.use((req, res, err, next) => {
  if (err.name === 'ValidationError') {
    // keep validation errors simple
    return res.status(422).json({
      error: {
        message: 'Schema validation failed',
      },
    });
  }
  return next(err);
});

module.exports = router;
