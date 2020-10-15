const router = require('express').Router();
const reviews = require('../services/review');
const comments = require('../services/comment');
const auth = require('../middleware/auth');

router.param('review', reviews.preloadReview);
router.param('comment', comments.preloadComment);

router.get('/', auth.optional, reviews.list);
router.get('/:review', auth.optional, reviews.get);
router.post('/', auth.required, reviews.create);
router.patch('/:review', auth.required, reviews.update);
router.delete('/:review', auth.required, reviews.delete);
router.post('/:review/favorite', auth.required, reviews.favorite);
router.delete('/:review/unfavorite', auth.required, reviews.unfavorite);

router.get('/:review/comments', auth.optional, comments.get);
router.post('/:review/comments', auth.required, comments.create);
router.patch('/:review/comments/:comment', auth.required, comments.update);
router.delete('/:review/comment/:comment', auth.required, comments.delete);
router.post('/:review/comments/:comment/favorite', auth.required, comments.favorite);
router.delete('/:review/comments/:comment/unfavorite', auth.required, comments.unfavorite);

module.exports = router;
