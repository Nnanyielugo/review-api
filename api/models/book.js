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
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  edited_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review',
  }],
}, { timestamps: true });

BookSchema.methods.toObjectJsonFor = function () {
  return {
    _id: this._id,
    title: this.title,
    author: this.author,
    summary: this.summary,
    isbn: this.isbn,
    genre: this.genre,
    reviews: this.reviews,
    created_by: this.created_by,
    edited_by: this.edited_by,
  };
};

const Book = mongoose.model('Book', BookSchema);
module.exports = Book;
