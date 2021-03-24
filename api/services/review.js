const { model } = require('mongoose');
const { ApiException } = require('../utils/error');

const User = model('User');
const Review = model('Review');
const Book = model('Book');

exports.preloadReview = async function (req, res, next, id) {
  try {
    const review = await Review
      .findById(id)
      .populate('review_author', 'username follower_count first_name family_name following')
      .populate('book', 'title summary author');

    if (!review) {
      throw new ApiException({
        message: 'The review you are looking for does not exist.',
        status: 404,
      });
    }
    req.review = review;
    console.log('review', review)
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
        .populate('book', 'title author genre summary')
        .exec(),
      Review
        .countDocuments(query)
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
    const user = await User.findById(req.payload.id);
    return res.json({ review: req.review.toObjectJsonFor(user) });
  } catch (err) {
    next(err);
  }
};

exports.create = async function (req, res, next) {
  try {
    if (!req.body.review) {
      throw new ApiException({
        message: 'You need to send the review object with this request.',
        status: 400,
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
      return new ApiException({ status: 401 });
    }
    if (user.suspended || user.suspension_timeline > Date.now()) {
      throw new ApiException({
        message: 'Suspended users cannot make reviews!',
        status: 403,
      });
    }

    if (!book) {
      throw new ApiException({
        message: 'The book you are trying to review does not exist!',
        status: 400,
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

exports.update = async function (req, res, next) {
  try {
    if (!req.body.review) {
      throw new ApiException({
        message: 'You need to send the review object with this request.',
        status: 400,
      });
    }

    if (req.review.review_author._id.toString() !== req.payload.id.toString()) {
      throw new ApiException({ status: 403 });
    }

    const user = await User.findById(req.payload.id);
    if (user.suspended || user.suspension_timeline > Date.now()) {
      throw new ApiException({
        message: 'Suspended users cannot update reviews!',
        status: 403,
      });
    }

    if (typeof req.body.review.content !== 'undefined') {
      req.review.content = req.body.review.content;
    }

    if (typeof req.body.review.tags !== 'undefined') {
      req.review.tags = req.body.review.tags;
    }

    await req.review.save();
    const doc = req.review.toObjectJsonFor(user);
    return res.status(200).json({ review: doc });

    // const review = await req.review.save();
    // return res.json({ review: review.toObjectJsonFor(user) });
  } catch (err) {
    next(err);
  }
};

exports.delete = async function (req, res, next) {
  try {
    const user_id = req.payload.id;
    const user = await User.findById(user_id);
    if (!user) {
      throw new ApiException({
        message: 'The user you requested does not exist!',
        status: 400,
      });
    }

    if ((req.review.review_author._id.toString() !== user_id.toString())
      && user.user_type !== 'admin') {
      throw new ApiException({
        message: 'You must either be review creator or an admin to delete this review',
        status: 403,
      });
    }

    await req.review.remove();
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

exports.favorite = async function (req, res, next) {
  try {
    const review_id = req.review._id;
    const user = await User.findById(req.payload.id);
    if (!user) {
      throw new ApiException({
        message: 'The user you requested does not exist!',
        status: 400,
      });
    }

    await user.favorite(review_id);
    await req.review.updateFavoriteCount();
    return res.json({ review: req.review.toObjectJsonFor(user) });
  } catch (err) {
    next(err);
  }
};

exports.unfavorite = async function (req, res, next) {
  try {
    const review_id = req.review._id;
    const user = await User.findById(req.payload.id);
    if (!user) {
      throw new ApiException({
        message: 'The user you requested does not exist!',
        status: 400,
      });
    }

    await user.unfavorite(review_id);
    await req.review.updateFavoriteCount();
    return res.json({ review: req.review.toObjectJsonFor(user) });
  } catch (err) {
    next(err);
  }
};
