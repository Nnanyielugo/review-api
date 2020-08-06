const { model } = require('mongoose');

const User = model('User');
const Review = model('Review');

exports.preloadReview = function (req, res, next, slug) {
  Review
    .findOne({ slug })
    .populate('author')
    .then((review) => {
      if (!review) {
        return res.status(404).json({
          error: {
            message: 'Review does not exist!',
          },
        });
      }
      req.review = review;
      return next();
    })
    .catch(next);
};

exports.list = function (req, res, next) {
  const query = {};
  let limit = {};
  let offset = 0;

  if (typeof req.query.limit !== 'undefined') {
    limit = req.query.limit;
  }
  if (typeof req.query.offset !== 'undefined') {
    offset = req.query.offset;
  }
  if (typeof req.query.tags !== 'undefined') {
    query.tags = { $in: [req.query.tags] };
  }

  Promise
    .all([
      req.query.author
        ? User.findOne({ username: req.query.author })
        : null,
      req.query.favorited
        ? User.findOne({ username: req.query.favorited })
        : null,
    ])
    .then((result) => {
      const [author, favoriter] = result;

      if (author) {
        query.author = author._id;
      }

      if (favoriter) {
        query._id = { $in: favoriter.favorites };
      } else if (req.query.favorited) {
        query._id = { $in: [] };
      }

      return Promise
        .all([
          Review
            .find(query)
            .limit(+limit)
            .skip(+offset)
            .sort({ createdAt: 'desc' })
            .populate('author')
            .exec(),
          Review
            .count(query)
            .exec(),
          req.payload
            ? User.findById(req.payload.id)
            : null,
        ])
        .then((results) => {
          const [reviews, reviewsCount, user] = results;
          return res.json({
            reviews: reviews.map((review) => review.toObjectJsonFor(user)),
            reviewsCount,
          });
        })
        .catch(next);
    })
    .catch(next);
};

exports.get = function (req, res, next) {
  Promise
    .all([
      req.payload
        ? User.findById(req.payload.id)
        : null,
      req.review
        .populate('author')
        .execPopulate(),
    ])
    .then((results) => {
      const user = results[0];
      return res.json({ review: req.review.toObjectJsonFor(user) });
    })
    .catch(next);
};

exports.create = function (req, res, next) {};

exports.update = function (req, res, next) {};

exports.delete = function (req, res, next) {};
