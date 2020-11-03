const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const { Schema } = mongoose;

const GenreSchema = Schema({
  name: {
    type: String,
    min: 3,
    max: 100,
    required: true,
    unique: true,
  },
  genre_author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

GenreSchema.plugin(uniqueValidator);

GenreSchema.methods.toObjectJsonFor = function (user) {
  return {
    _id: this._id,
    name: this.name,
    genre_author: this.genre_author.toObjectJsonFor(user),
  };
};

const Genre = mongoose.model('Genre', GenreSchema);
module.exports = Genre;
