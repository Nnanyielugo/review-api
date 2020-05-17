const router = require('express').Router();

const catalog = require('./catalog');

router.use('/catalog', catalog);

// handle validation error messages
//    TODO: verify
router.use((req, res, err, next) => {
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce((errors, key) => {
        errors[key] = err.errors[key].message;
        return errors;
      }, {}),
    });
  }
  return next(err);
});

module.exports = router;
