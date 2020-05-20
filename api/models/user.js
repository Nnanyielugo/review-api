const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const { Schema } = mongoose;

const UserSchema = Schema({
  first_name: { type: String, required: true, max: 100 },
  family_name: { type: String, required: true, max: 100 },
  username: {
    type: String,
    required: true,
    unique: true,
    max: 100,
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
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  followerCount: { type: Number, default: 0 },
  hash: String,
  salt: String,
  // favorites:
  // reviews:
  // pinnedReviews
  // pinnedComments // not sure
}, { timestamps: true });

UserSchema.plugin(uniqueValidator, { message: '{Path} is already taken.' });

const User = mongoose.model('User', UserSchema);
module.exports = User;
