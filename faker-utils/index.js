const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname);
files.forEach((filename) => {
  if (filename !== 'index.js') {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    require(path.join(__dirname, filename));
  }
});
