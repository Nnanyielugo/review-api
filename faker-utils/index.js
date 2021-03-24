const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname);
const mappings = {};
files.forEach((filename) => {
  if (filename !== 'index.js') {
    const name = filename.split('.')[0];
    // eslint-disable-next-line import/no-dynamic-require, global-require
    mappings[name] = require(path.join(__dirname, filename));
  }
});

module.exports = mappings;
