const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { secret } = require('config');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function arrayLimit(val) {
  return val.limit >= 5;
}

const UserSchema = new mongoose.Schema({
  first_name: { type: String, required: true, max: 100 },
  family_name: { type: String, required: true, max: 100 },
  username: {
    type: String,
    required: true,
    unique: true,
    max: 100,
    match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
    index: true,
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "can't be blank"],
    match: [/\S+@\S+\.\S+/, 'is invalid'],
    index: true,
  },
  user_type: {
    type: String,
    required: true,
    enum: ['admin', 'moderator', 'user'],
    default: 'user',
  },
  image_src: { type: String },
  bio: String,
  date_of_birth: Date,
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  follower_count: { type: Number, default: 0 },
  hash: String,
  salt: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  pinned_reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    validate: [arrayLimit, '{PATH} exceeds limit of 5'],
  }],
  // pinnedComments // not sure
}, { timestamps: true });

UserSchema.plugin(uniqueValidator, { message: '{Path} is already taken.' });

UserSchema.methods.validPassword = function (password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

UserSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.generateJwt = function () {
  const today = new Date();
  const exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000, 10),
  }, secret);
};

UserSchema.methods.toAuthJsonFor = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    token: this.generateJwt(),
    bio: this.bio,
    image_src: this.image_src,
  };
};

UserSchema.methods.toObjectJsonFor = function (user) {
  return {
    username: this.username,
    bio: this.bio,
    image_src: this.image_src,
    following: user ? user.isFollowing(this._id) : false,
    followers: this.followers,
    follower_count: this.follower_count,
  };
};

UserSchema.methods.favorite = function (id) {
  if (!this.favorites.includes(id)) {
    this.favorites.unshift(id);
  }

  return this.save();
};

UserSchema.methods.unfavorite = function (id) {
  if (this.favorites.includes(id)) {
    this.favorites.remove(id);
    return this.save();
  }
};

UserSchema.methods.isFavorite = function (id) {
  return this.favorites.some((favoriteId) => favoriteId.toString() === id.toString());
};

UserSchema.methods.addFollower = function (profile, user) {
  profile.followers.unshift(user._id);

  return profile.save();
};

UserSchema.methods.removeFollower = function (profile, user) {
  profile.followers.remove(user._id);

  return profile.save();
};

UserSchema.methods.follow = function (id) {
  if (!this.following.includes(id)) {
    this.following.unshift(id);
  }
};

UserSchema.methods.unfollow = function (id) {
  if (this.following.includes(id)) {
    this.following.remove(id);
    return this.save();
  }
};

UserSchema.methods.isFollowing = function (id) {
  return this.following.some((followId) => followId.toString() === id.toString());
};

const User = mongoose.model('User', UserSchema);

UserSchema.methods.updateFollowerCount = function (profile) {
  return User
    .count({ followers: { $in: [profile.id] } })
    .then(() => { // examine how this method works, and fix where necessary
      profile.follower_count = profile.followers.length;
      return profile.save();
    });
};

module.exports = User;
