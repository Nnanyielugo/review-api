const moment = require('moment');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const AuthorSchema = Schema({
  first_name: {
    type: String,
    required: [true, "can't be blank"],
    max: 100,
  },
  family_name: {
    type: String,
    required: [true, "can't be blank"],
    max: 100,
  },
  // image_src
  // followers: [{ type: Schema.Types.ObjectId }]
  // following
  // likes_aggregate
  date_of_birth: Date,
  date_of_death: Date,
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  edited_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  bio: String,
}, { timestamps: true });

AuthorSchema
  .virtual('name')
  .get(function () {
    return `${this.family_name}, ${this.first_name}`;
  });


AuthorSchema
  .virtual('lifespan')
  .get(function () {
    let lifetime_string = '';
    if (this.date_of_birth) {
      lifetime_string = moment(this.date_of_birth).format('YYYY-MM-DD');
    }
    lifetime_string += ' - ';
    if (this.date_of_death) {
      lifetime_string += moment(this.date_of_death).format('YYYY-MM-DD');
    }
    return lifetime_string;
  });

AuthorSchema.methods.toObjectJsonFor = function (books) {
  return {
    id: this._id,
    first_name: this.first_name,
    family_name: this.family_name,
    books,
    date_of_birth: this.date_of_birth,
    date_of_death: this.date_of_death,
    lifespan: this.lifespan,
  };
};

const Author = mongoose.model('Author', AuthorSchema);
module.exports = Author;
