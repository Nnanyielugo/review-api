const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
}, { timestamps: true });

CommentSchema.methods.toObjectJsonFor = function (user) {
  return {
    id: this._id,
    content: this.content,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    author: this.author.toObjectJsonFor(user),
  };
};

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;
