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
        res.sendStatus(401);
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
        req.sendStatus(401);
      }

      const comment_author_id = req.comment.author._id;
      if (comment_author_id.toString() !== req.payload.id.toString()) {
        res.sendStatus(403);
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

exports.delete = function (req, res, next) {};

exports.favorite = function (req, res, next) {};

exports.unfavorite = function (req, res, next) {};
