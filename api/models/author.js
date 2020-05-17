const moment = require('moment');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const AuthorSchema = Schema({
  first_name: { type: String, required: true, max: 100 },
  family_name: { type: String, required: true, max: 100 },
  date_of_birth: Date,
  date_of_death: Date,
});

AuthorSchema
  .virtual('name')
  .get(function () {
    return `${this.family_name}, ${this.first_name}`;
  });

AuthorSchema
  .virtual('url')
  .get(function () {
    return `/catalog/author/${this._id}`;
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

AuthorSchema
  .virtual('date_of_birth_formatted')
  .get(function () {
    return this.date_of_birth
      ? moment(this.date_of_birth).format('MMM-Do-YYYY') : '';
  });

AuthorSchema
  .virtual('date_of_death_formatted')
  .get(function () {
    return this.date_of_birth
      ? moment(this.date_of_death).format('MMM-Do-YYYY') : '';
  });

AuthorSchema
  .virtual('dob')
  .get(function () {
    return this.date_of_birth
      ? moment(this.date_of_birth).format('YYYY-MM-DD') : '';
  });

AuthorSchema
  .virtual('dod')
  .get(function () {
    return this.date_of_death
      ? moment(this.date_of_death).format('YYYY-MM-DD') : '';
  });

module.exports = mongoose.model('Author', AuthorSchema);
