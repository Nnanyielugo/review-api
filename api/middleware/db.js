const mongoose = require('mongoose');
const { dbUrl } = require('config');

const isTest = process.env.NODE_ENV === 'test';

const options = {
  useFindAndModify: false,
  useNewUrlParser: true,
};

mongoose.connect(dbUrl, options);
const db = mongoose.connection;
if (!isTest) {
  db.on('connected', () => {
    console.log(`Mongoose connected to : ${dbUrl}`);
  });

  db.on('error', console.error.bind(console, 'MongoDB connection error:'));

  db.on('disconnected', () => {
    console.log('Mongoose disconnected');
  });
}

require('../models');
