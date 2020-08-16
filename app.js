const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const methodOverride = require('method-override');

require('./api/middleware/db');
require('./api/middleware/passport');
const api = require('./api/routes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';


app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res, next) => {
  res.status(200).json({
    message: 'You have reached the library api',
  });
});

app.use('/api', api);

// / catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler, will print stacktrace
if (!isProduction) {
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500);
    res.json({
      error: {
        message: err.message,
        error: err,
      },
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      error: {},
    },
  });
});

app.set('port', process.env.PORT || 3000);
const server = app.listen(app.get('port'), () => {
  console.log(`Server listening on port: ${server.address().port}`);
});

module.exports = app;
