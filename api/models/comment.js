const mongoose = require('mongoose');

const User = mongoose.model('User');

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  comment_author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
  },
  favorites_count: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

CommentSchema.methods.updateFavoriteCount = async function () {
  const count = await User.countDocuments({ favorites: { $in: [this._id] } });
  this.favorites_count = count;
  return this.save();
};

CommentSchema.methods.toObjectJsonFor = function (user) {
  return {
    _id: this._id,
    content: this.content,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    review: this.review,
    comment_author: this.comment_author.toObjectJsonFor(user),
    favorites_count: this.favorites_count,
    favorited: user ? user.isFavorite(this._id) : false,
  };
};

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;
