const { model } = require('mongoose');

const User = model('User');
const Review = model('Review');
const Book = model('Book');

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

exports.create = function (req, res, next) {
  Promise
    .all(
      User
        .findById(req.payload.id)
        .exec(),
      Book
        .findById(req.body.book_id)
        .exec(),
    )
    .then((results) => {
      const [user, book] = results;
      if (!user) {
        return res.sendStatus(401);
      }

      if (!book) {
        return res.send(400).json({
          error: {
            message: 'The book you are trying to review does not exist!',
          },
        });
      }

      // TODO: handle file uploads

      const review = new Review({
        content: req.body.content,
        tags: req.body.tags,
        author: user,
        book,
      });

      return review
        .save()
        .then(() => res.json({ review: review.toObjectJsonFor(user) }))
        .catch(next);
    })
    .catch(next);
};

exports.update = function (req, res, next) {
  User
    .findById(req.payload.id)
    .then((user) => {
      if (req.review.author._id.toString() !== req.payload.id.toString()) {
        return res.sendStatus(403);
      }

      if (typeof req.body.content !== 'undefined') {
        req.review.content = req.body.content;
      }

      if (typeof req.body.tags !== 'undefined') {
        req.review.tags = req.body.tags;
      }

      // TODO: implement image file paths/link

      req.review
        .save()
        .then((review) => res.json({ review: review.toObjectJsonFor(user) }))
        .catch(next);
    })
    .catch(next);
};

exports.delete = function (req, res, next) {
  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }

      if (req.review.author._id.toString() !== req.payload.id.toString()) {
        return res.sendStatus(403);
      }

      return req.review
        .remove()
        .then(() => res.sendStatus(204))
        .catch(next);
    })
    .catch(next);
};

exports.favorite = function (req, res, next) {
  const review_id = req.review._id;

  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }

      return user
        .favorite(review_id)
        .then(() => req.review
          .updateFavoriteCount()
          .then((review) => res.json({ review: review.toObjectJsonFor(user) })))
        .catch(next);
    })
    .catch(next);
};

exports.unfavorite = function (req, res, next) {
  const review_id = req.review._id;

  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }

      return user
        .unfavorite(review_id)
        .then(() => req.review
          .updateFavoriteCount()
          .then((review) => res.json({ review: review.toObjectJsonFor(user) })))
        .catch(next);
    })
    .catch(next);
};
