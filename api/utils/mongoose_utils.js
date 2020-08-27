const mongoose = require('mongoose');

const options = {
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

module.exports = function (db_url) {
  mongoose.connect(db_url, options);
};
