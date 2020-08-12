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
          path: 'author',
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

exports.create = function (req, res, next) {
  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }

      if (user.suspended || user.suspension_timeline > Date.now()) {
        return res.status(400).json({
          error: {
            message: 'Suspended users cannot leave comments!',
          },
        });
      }

      const comment = new Comment(req.body.comment);
      comment.review = req.review;
      comment.author = user;

      return comment
        .save()
        .then(() => {
          req.review.comments.push(comment);

          return req.review
            .save()
            .then((_review) => res.json({
              comment: comment.toObjectJsonFor(user),
            }));
        });
    })
    .catch(next);
};

exports.update = function (req, res, next) {
  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return req.sendStatus(401);
      }

      const comment_author_id = req.comment.author._id;
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
  const author_id = req.comment_author_id;
  if (author_id.toString() !== req.payload.toString()) {
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

exports.favorite = function (req, res, next) {};

exports.unfavorite = function (req, res, next) {};
