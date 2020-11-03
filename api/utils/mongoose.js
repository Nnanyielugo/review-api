const mongoose = require('mongoose');

const options = {
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

module.exports.connect_mongoose = function (db_url) {
  mongoose.connect(db_url, options);
};
