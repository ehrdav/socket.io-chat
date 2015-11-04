var mongoose = require('mongoose');
var session = require('express-session'); //express-session
var MongoStore = require('connect-mongo')(session);

var sessionStore = new MongoStore({
		  mongooseConnection: mongoose.connection,
				touchAfter: 14 * 24 * 60 * 60
		});

module.exports = sessionStore;