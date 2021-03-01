const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { secret } = require('config');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function arrayLimit(val) {
  return val.limit >= 5;
}

const UserSchema = new mongoose.Schema({
  display_name: { type: String, required: true, max: 100 },
  username: {
    type: String,
    required: [true, "can't be blank"],
    unique: true,
    max: 100,
    match: [/^[a-zA-Z0-9_@.]+$/, 'is invalid'],
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
  suspended: {
    type: Boolean,
    default: false,
  },
  suspension_timeline: Date,
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'on_model',
  }],
  on_model: {
    type: String,
    enum: ['Review', 'Comment'],
  },
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
    activeUser: {
      _id: this._id,
      username: this.username,
      email: this.email,
      bio: this.bio,
      followers: this.followers,
      image_src: this.image_src,
      display_name: this.display_name,
      user_type: this.user_type,
      suspended: this.suspended,
    },
    token: this.generateJwt(),
  };
};

UserSchema.methods.toObjectJsonFor = function (user) {
  return {
    username: this.username,
    bio: this.bio,
    image_src: this.image_src,
    following: user ? this.isFollowing(user._id) : false,
    followers: this.followers,
    follower_count: this.follower_count,
    display_name: this.display_name,
    suspended: this.suspended,
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

UserSchema.methods.follow = function (target_user) {
  const update_following = () => {
    if (!this.following.includes(target_user._id)) {
      this.following.unshift(target_user._id);
      return this.save();
    }
  };

  const update_followers = () => {
    if (!target_user.followers.includes(this._id)) {
      target_user.followers.unshift(this._id);
      return target_user.save();
    }
  };

  return Promise.all([update_following(), update_followers()]);
};

UserSchema.methods.unfollow = function (target_user) {
  const update_following = () => {
    if (this.following.includes(target_user._id)) {
      this.following.remove(target_user._id);
      return this.save();
    }
  };

  const update_followers = () => {
    if (target_user.followers.includes(this._id)) {
      target_user.followers.remove(this._id);
      return target_user.save();
    }
  };

  return Promise.all([update_following(), update_followers()]);
};

UserSchema.methods.isFollowing = function (id) {
  return this.following.some((followId) => followId.toString() === id.toString());
};

UserSchema.methods.updateFollowerCount = async function (count) {
  this.follower_count = count;
  return this.save();
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
