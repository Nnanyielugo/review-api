const { model } = require('mongoose');

const Comment = model('Comment');
const User = model('User');

exports.preloadComment = function (req, res, next, id) {
  Comment
    .findById(id)
    .then((comment) => {
      if (!comment) {
        return res.status(404).json({
          error: {
            message: 'Comment does not exist!',
          },
        });
      }

      req.comment = comment;
      return next();
    })
    .catch(next);
};

exports.get = function (req, res, next) {
  Promise
    .resolve(req.payload ? User.findById(req.payload.id) : null)
    .then(((user) => req.review
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
      })
      .execPopulate()
      .then((review) => res.json({
        // comments: req.review.comments.map(function)
        comments: review.comments.map((comment) => comment.toObjectJsonFor(user)),
      }))))
    .catch(next);
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

exports.update = function (req, res, next) {
  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return req.sendStatus(401);
      }

      const comment_author_id = req.comment.comment_author._id;
      if (comment_author_id.toString() !== req.payload.id.toString()) {
        return res.sendStatus(403);
      }

      if (user.suspended || user.suspension_timeline > Date.now()) {
        return res.status(400).json({
          error: {
            message: 'Suspended users cannot edit comments!',
          },
        });
      }

      Comment
        .findById(req.comment._id)
        .then((comment) => {
          if (!comment) {
            return res.status(404).json({
              error: {
                message: 'Comment does not exist!',
              },
            });
          }

          return comment
            .update(req.body.comment)
            .then((_comment) => {
              // TODO: explore better ways to remove comment from review
              // req.review.comments.update(req.comment._id)
              const comment_index = req.review.comments.findIndex((revComment) => revComment._id === _comment._id);
              if (comment_index < 0) {
                return res.status(404).json({
                  error: {
                    message: 'Comment does not exist!',
                  },
                });
              }
              req.review.comments.splice(comment_index, 1, _comment);
              return req.review
                .save()
                .then((_review) => {
                  res.json({
                    comment: comment.toObjectJsonFor(user),
                  });
                });
            })
            .catch(next);
        })
        .catch(next);
    })
    .catch(next);
};

exports.delete = function (req, res, next) {
  const comment_author_id = req.comment.comment_author._id;
  if (comment_author_id.toString() !== req.payload.toString()) {
    res.sendStatus(401);
  }

  req.review.comments.remove(req.comment._id);
  return req.review
    .save()
    .then(
      Comment
        .findByIdAndRemove(req.comment._id)
        .exec()
        .catch(next),
    )
    .then(() => res.sendStatus(204));
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
