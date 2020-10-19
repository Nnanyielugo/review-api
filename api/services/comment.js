const { model } = require('mongoose');

const Comment = model('Comment');
const User = model('User');
const Review = model('Review');

exports.preloadComment = async function (req, res, next, id) {
  try {
    const comment = await Comment
      .findById(id)
      .populate('comment_author');

    if (!comment) {
      return res.status(400).json({
        error: {
          message: 'Comment does not exist!',
        },
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
    const user = await User.findById(req.payload.id);
    if (!user) {
      return res.sendStatus(401);
    }

    if (user.suspended || user.suspension_timeline > Date.now()) {
      return res.status(403).json({
        error: {
          message: 'Suspended users cannot leave comments!',
        },
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
    const user_id = req.payload.id;
    const user = await User.findById(user_id);

    if (!user) {
      return req.sendStatus(401);
    }

    const comment_author_id = req.comment.comment_author._id;
    if (comment_author_id.toString() !== user_id.toString()) {
      return res.sendStatus(403);
    }

    if (user.suspended || user.suspension_timeline > Date.now()) {
      return res.status(400).json({
        error: {
          message: 'Suspended users cannot edit comments!',
        },
      });
    }

    if (typeof req.body.comment.content !== 'undefined') {
      req.comment.content = req.body.comment.content;
    }

    await req.comment.updateOne();
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
      return res.status(403).json({
        error: {
          message: 'You must either be comment creator or an admin to delete this comment',
        },
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

exports.favorite = function (req, res, next) {
  const comment_id = req.comment._id;

  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }

      return user
        .favorite(comment_id)
        .then(() => req.comment
          .updateFavoriteCount()
          .then((comment) => res.json({
            comment: comment.toObjectJsonFor(user),
          })))
        .catch(next);
    })
    .catch(next);
};

exports.unfavorite = function (req, res, next) {
  const comment_id = req.comment._id;

  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }

      return user
        .unfavorite(comment_id)
        .then(() => req.comment
          .updateFavoriteCount()
          .then((comment) => res.json({
            comment: comment.toObjectJsonFor(user),
          })))
        .catch(next);
    })
    .catch(next);
};
