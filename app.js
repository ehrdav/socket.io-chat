var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('./libs/mongoose');
var config = require('./config');
var errorHandler = require('errorhandler')
var HttpError = require('./error').HttpError;

var routes = require('./routes/index');
var users = require('./routes/users');

process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'production';

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (app.get('env') == 'development') {
  app.use(logger('dev'));
} else {
  app.use(logger('combined'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var sessionStore = require('./libs/sessionStore');

app.use(session({
  secret: config.get('session:secret'),
		saveUninitialized: false,
		resave: false,
		key: config.get('session:key'),
		cookie: config.get('session:cookie'),
		store: sessionStore
}));

app.use(require('./middleware/sendHttpError'));
app.use(require('./middleware/loadUser'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// error handlers

app.use(function(err, req, res, next) {
  if (typeof err == 'number') { // next(404);
    err = new HttpError(err);
  }

  if (err instanceof HttpError) {
    res.sendHttpError(err);
  } else {
    if (app.get('env') == 'development') {
      errorHandler()(err, req, res, next);
    } else {
      console.error(err);
      err = new HttpError(500);
      res.sendHttpError(err);
    }
  }
});

var io = require('./socket')(app);
app.set('io', io);

module.exports = app;

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
*/

/*
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,	
    error: {}
  });
});
*/