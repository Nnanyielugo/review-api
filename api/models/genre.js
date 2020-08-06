const mongoose = require('mongoose');

const { Schema } = mongoose;

const genreSchema = Schema({
  name: {
    type: String, min: 3, max: 100, required: true,
  },
});

const Genre = mongoose.model('Genre', genreSchema);
module.exports = Genre;
