const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');
const uuid = require('uuid/dist/v4');

const User = mongoose.model('user');

const ReviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
  },
  content: String,
  favorites_count: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
  // image_src: String, // TODO: implement array of images or use book image
  tags: [String],
}, { timestamps: true });

ReviewSchema.plugin(uniqueValidator, { message: '{Path} is already taken.' });

ReviewSchema.pre('validate', function (next) {
  if (!this.slug) {
    this.slugify();
  }
  next();
});

ReviewSchema.methods.slugify = function () {
  this.slug = slug(this.author) + uuid() + (Math.random()).toString();
};

ReviewSchema.methods.updateFavoriteCount = function () {
  const post = this;
  return User
    .count({ favorites: { $in: [post.id] } })
    .then((count) => {
      post.favorites_count = count;
      return post.save();
    });
};

ReviewSchema.methods.toObjectJsonFor = function (user) {
  return {
    slug: this.slug,
    content: this.content,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    image_src: this.image_src,
    favorited: user ? user.isFavorite(this._id) : false,
    favorites_count: this.favorites_count,
    author: this.author.toObjectJsonFor(user),
  };
};

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
