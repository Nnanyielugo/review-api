const { model } = require('mongoose');
const { ApiException } = require('../utils/error');

const Comment = model('Comment');
const User = model('User');
const Review = model('Review');

exports.preloadComment = async function (req, res, next, id) {
  try {
    const comment = await Comment
      .findById(id)
      .populate('comment_author');

    if (!comment) {
      throw new ApiException({
        message: 'The comment you are looking for does not exist.',
        status: 404,
      });
    }

    req.comment = comment;
    return next();
  } catch (err) {
    next(err);
  }
};

exports.get = async function (req, res, next) {
  try {
    const user = req.payload ? await User.findById(req.payload.id) : null;
    const review = await Review
      .findById(req.review._id)
      .populate({
        path: 'comments',
        populate: {
          path: 'comment_author',
        },
        options: {
          sort: {
            createdAt: 'desc',
          },
        },
      });
    const comments = review.comments.map((comment) => comment.toObjectJsonFor(user));
    return res.json({ comments });
  } catch (err) {
    next(err);
  }
};

exports.create = async function (req, res, next) {
  try {
    if (!req.body.comment) {
      throw new ApiException({
        message: 'You need to send the comment object with this request.',
        status: 400,
      });
    }
    const user = await User.findById(req.payload.id);
    if (!user) {
      throw new ApiException({ status: 401 });
    }

    if (user.suspended || user.suspension_timeline > Date.now()) {
      throw new ApiException({
        message: 'Suspended users cannot leave comments!',
        status: 403,
      });
    }

    const comment = new Comment({
      content: req.body.comment.content,
      review: req.review._id,
      comment_author: user,
    });

    await comment.save();
    await req.review.comments.push(comment);
    await req.review.save();
    return res.json({
      comment: comment.toObjectJsonFor(user),
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async function (req, res, next) {
  try {
    if (!req.body.comment) {
      throw new ApiException({
        message: 'You need to send the comment object with this request.',
        status: 400,
      });
    }
    const user_id = req.payload.id;
    const user = await User.findById(user_id);

    if (!user) {
      throw new ApiException({ status: 401 });
    }

    const comment_author_id = req.comment.comment_author._id;
    if (comment_author_id.toString() !== user_id.toString()) {
      return res.sendStatus(403);
    }

    if (user.suspended || user.suspension_timeline > Date.now()) {
      throw new ApiException({
        message: 'Suspended users cannot edit comments!',
        status: 403,
      });
    }

    if (typeof req.body.comment.content !== 'undefined') {
      req.comment.content = req.body.comment.content;
    }

    await req.comment.save();
    const doc = req.comment.toObjectJsonFor(user);
    return res.json({ comment: doc });
  } catch (err) {
    next(err);
  }
};

exports.delete = async function (req, res, next) {
  try {
    const user_id = req.payload.id;
    const user = await User.findById(user_id);
    const comment_author_id = req.comment.comment_author._id;
    if (
      (comment_author_id.toString() !== user_id.toString())
        && user.user_type !== 'admin'
    ) {
      throw new ApiException({
        message: 'You must either be comment creator or an admin to delete this comment',
        status: 403,
      });
    }

    await Promise.all([
      req.review.comments.remove(req.comment._id),
      Comment.findByIdAndRemove(req.comment._id),
    ]);
    await req.review.save();
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

exports.favorite = async function (req, res, next) {
  try {
    const comment_id = req.comment._id;
    const user = await User.findById(req.payload.id);
    if (!user) {
      throw new ApiException({ status: 401 });
    }
    await user.favorite(comment_id);
    const comment = await req.comment.updateFavoriteCount();
    return res.json({
      comment: comment.toObjectJsonFor(user),
    });
  } catch (err) {
    next(err);
  }
};

exports.unfavorite = async function (req, res, next) {
  try {
    const comment_id = req.comment._id;
    const user = await User.findById(req.payload.id);
    if (!user) {
      throw new ApiException({ status: 401 });
    }
    await user.unfavorite(comment_id);
    const comment = await req.comment.updateFavoriteCount();
    return res.json({
      comment: comment.toObjectJsonFor(user),
    });
  } catch (err) {
    next(err);
  }
};
