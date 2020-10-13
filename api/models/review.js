const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');
const { v4: uuid } = require('uuid');

const User = mongoose.model('User');

const ReviewSchema = new mongoose.Schema({
  review_author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true,
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
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
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Genre',
  }],
}, { timestamps: true });

ReviewSchema.plugin(uniqueValidator, { message: '{Path} is already taken.' });

ReviewSchema.pre('validate', function (next) {
  if (!this.slug) {
    this.slugify();
  }
  next();
});

ReviewSchema.methods.slugify = function () {
  this.slug = slug(String(this.review_author._id)) + uuid() + (Math.random()).toString();
};

ReviewSchema.methods.updateFavoriteCount = function () {
  const review = this;
  return User
    .count({ favorites: { $in: [review.id] } })
    .then((count) => {
      review.favorites_count = count;
      return review.save();
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
    author: this.review_author.toObjectJsonFor(user),
    book: this.book.toObjectJsonFor(),
  };
};

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
