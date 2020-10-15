const mongoose = require('mongoose');

const User = mongoose.model('User');

const CommentSchema = new mongoose.Schema({
  content: String,
  comment_author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
  },
  favoriteCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

CommentSchema.methods.updateFavoriteCount = function () {
  const comment = this;
  return User
    .count({ favorites: { $in: [comment.id] } })
    .then((count) => {
      comment.favorites_count = count;
      return comment.save();
    });
};

CommentSchema.methods.toObjectJsonFor = function (user) {
  return {
    _id: this._id,
    content: this.content,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    review: this.review,
    comment_author: this.comment_author.toObjectJsonFor(user),
  };
};

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;
