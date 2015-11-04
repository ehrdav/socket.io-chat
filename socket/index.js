var log = require('../libs/log')(module);
var config = require('../config');
var connect = require('connect'); // npm i connect
var async = require('async');
var cookie = require('cookie');   // npm i cookie
var cookieParser = require('cookie-parser');
var sessionStore = require('../libs/sessionStore');
var HttpError = require('../error').HttpError;
var User = require('../models/user').User;

function loadSession(sid, callback) {

  // sessionStore callback is not quite async-style!
  sessionStore.load(sid, function(err, session) {
    if (arguments.length == 0) {
      // no arguments => no session
      return callback(null, null);
    } else {
      return callback(null, session);
    }
  });

}

function loadUser(session, callback) {

  if (!session.user) {
    log.debug("Session %s is anonymous", session.id);
    return callback(null, null);
  }

  log.debug("retrieving user ", session.user);

  User.findById(session.user, function(err, user) {
    if (err) return callback(err);

    if (!user) {
      return callback(null, null);
    }
    log.debug("user findbyId result: " + user);
    callback(null, user);
  });

}

module.exports = function(app) {

		var io = require('socket.io')({
				'origins': 'localhost:*',
				'logger': log
		});

	//	app.io = io;

  io.use(function(socket, next) {
			 var handshake = socket.request;
				
    async.waterfall([
      function(callback) {
        handshake.cookies = cookie.parse(handshake.headers.cookie || '');
        var sidCookie = handshake.cookies[config.get('session:key')];
        var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
        loadSession(sid, callback);
      },
      function(session, callback) {

        if (!session) {
          callback(new HttpError(401, "No session"));
        }

        socket.handshake.session = session;
        loadUser(session, callback);
      },
      function(user, callback) {
        if (!user) {
          callback(new HttpError(403, "Anonymous session may not connect"));
        }
        
        callback(null, user);
      }
						
    ], function(err, user) {					
        if (err) {
									
									 if (err instanceof HttpError) {
											 return next(new Error('not authorized'));
								 	}

								  next(err);
								}
								
				   socket.handshake.user = user;
	      next();			
				});
				
  });

		io.on('connection', function (socket) {
			
			 var userRoom = "user:room:" + socket.handshake.user.username;
    socket.join(userRoom);
			
    var username = socket.handshake.user.username;
    socket.broadcast.emit('join', username);
				
				socket.on('message', function (text, cb) {
						socket.broadcast.emit('message', username, text);
						cb && cb();
				});

    socket.on('disconnect', function() {
      socket.broadcast.emit('leave', username);
    });

  });

		app.io = io;
};