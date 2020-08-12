const mongoose = require('mongoose');

const { Schema } = mongoose;

const BookSchema = Schema({
  title: { type: String, required: true },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Author',
    required: true,
  },
  summary: { type: String, required: true },
  isbn: { type: String, required: true },
  genre: [{ type: Schema.Types.ObjectId, ref: 'Genre' }],
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review',
  }],
}, { timestamps: true });

const Book = mongoose.model('Book', BookSchema);
module.exports = Book;
