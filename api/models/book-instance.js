const moment = require('moment');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const BookInstanceSchema = Schema({
  book: { type: Schema.ObjectId, ref: 'Book', required: true },
  imprint: { type: String, required: true },
  status: {
    type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Available',
  },
  due_back: { type: Date, default: Date.now },
});

BookInstanceSchema
  .virtual('url')
  .get(function () {
    return `/catalog/bookinstance/${this._id}`;
  });

BookInstanceSchema
  .virtual('due_back_formatted')
  .get(function () {
    return moment(this.due_back).format('MMM Do, YYYY');
  });

module.exports = mongoose.model('BookInstance', BookInstanceSchema);
