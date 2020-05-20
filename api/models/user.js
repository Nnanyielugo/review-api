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
}, { timestamps: true });

UserSchema.plugin(uniqueValidator, { message: '{Path} is already taken.' });

const User = mongoose.model('User', UserSchema);
module.exports = User;
