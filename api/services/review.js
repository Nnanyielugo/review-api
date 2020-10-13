const { model } = require('mongoose');

const User = model('User');
const Review = model('Review');
const Book = model('Book');

exports.preloadReview = async function (req, res, next, slug) {
  try {
    const review = await Review
      .findOne({ slug })
      .populate('review_author book');

    if (!review) {
      return res.status(404).json({
        error: {
          message: 'Review does not exist!',
        },
      });
    }
    req.review = review;
    return next();
  } catch (err) {
    next(err);
  }
};

exports.list = async function (req, res, next) {
  try {
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

    // find author and favoriter if they were specified in query
    const [author, favoriter] = await Promise
      .all([
        req.query.author
          ? User.findOne({ username: req.query.author })
          : null,
        req.query.favorited
          ? User.findOne({ username: req.query.favorited })
          : null,
      ]);

    if (author) {
      query.author = author._id;
    }

    if (favoriter) {
      query._id = { $in: favoriter.favorites };
    } else if (req.query.favorited) {
      query._id = { $in: [] };
    }

    const [reviews, reviewsCount, user] = await Promise.all([
      Review
        .find(query)
        .limit(+limit)
        .skip(+offset)
        .sort({ createdAt: 'desc' })
        .populate('review_author', 'username')
        .populate('book', 'author genre summary')
        .exec(),
      Review
        .count(query)
        .exec(),
      req.payload
        ? User.findById(req.payload.id)
        : null,
    ]);
    return res.json({
      reviews: reviews.map((review) => review.toObjectJsonFor(user)),
      reviewsCount,
    });
  } catch (err) {
    next(err);
  }
};

exports.get = async function (req, res, next) {
  try {
    // const results = await Promise.all([
    //   req.payload
    //     ? User.findById(req.payload.id)
    //     : null,
    //   req.review
    //     .populate('author')
    //     .execPopulate(),
    // ]);
    // const user = results[0];
    // return res.json({ review: req.review.toObjectJsonFor(user) });
  } catch (err) {
    next(err);
  }
};

exports.create = async function (req, res, next) {
  try {
    if (!req.body.review) {
      return res.status(400).json({
        error: {
          message: 'You need to send the review object with this request',
        },
      });
    }
    const [user, book] = await Promise.all([
      User
        .findById(req.payload.id)
        .exec(),
      Book
        .findById(req.body.review.book_id)
        .exec(),
    ]);
    if (!user) {
      return res.sendStatus(401);
    }
    if (user.suspended || user.suspension_timeline > Date.now()) {
      return res.status(400).json({
        error: {
          message: 'Suspended users cannot make reviews!',
        },
      });
    }

    if (!book) {
      return res.status(400).json({
        error: {
          message: 'The book you are trying to review does not exist!',
        },
      });
    }

    // TODO: handle file uploads
    const review = new Review({
      content: req.body.review.content,
      tags: req.body.review.tags,
      review_author: user,
      book,
    });

    await review.save();
    await book.reviews.push(review._id);
    await book.save(); // TODO: check if there is a better way of doing this
    return res.status(201).json({ review: review.toObjectJsonFor(user) });
  } catch (err) {
    next(err);
  }
};

exports.update = function (req, res, next) {
  User
    .findById(req.payload.id)
    .then((user) => {
      if (req.review.author._id.toString() !== req.payload.id.toString()) {
        return res.sendStatus(403);
      }

      if (user.suspended || user.suspension_timeline > Date.now()) {
        return res.status(400).json({
          error: {
            message: 'Suspended users cannot make reviews!',
          },
        });
      }

      if (typeof req.body.review.content !== 'undefined') {
        req.review.content = req.body.content;
      }

      if (typeof req.body.review.tags !== 'undefined') {
        req.review.tags = req.body.tags;
      }

      // TODO: implement image file paths/link

      return req.review
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
