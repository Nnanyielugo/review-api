const mongoose = require('mongoose');
const { dbUrl } = require('config');

mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on('connected', () => {
  console.log(`Mongoose connected to : ${dbUrl}`);
});

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

require('../models');
