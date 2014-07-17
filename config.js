var express = require('express')
  , db = require('mongoose')
  , ascoltatori = require('ascoltatori')
  , mongoStore = require('connect-mongo')(express)
  , LocalStrategy = require('passport-local').Strategy
  , SessionSockets = require('session.socket.io')
  , socket = require('./lib/socket')
  , store = require('./lib/store')
  , path = require('path')
  , util = require('util')
  , fs = require('fs');

module.exports = exports = function(app, io, passport) {
  /*
    MongoDb configuration
  */
  var DATABASE_HOST
    , DATABASE_NAME
    , DATABASE_USER
    , DATABASE_PASSWORD;

  switch (app.settings.env) {
    case 'production':
      DATABASE_HOST = process.env.DATABASE_HOST;
      DATABASE_NAME = process.env.DATABASE_NAME;
      DATABASE_USER = process.env.DATABASE_USER;
      DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
      break;
    
    case 'development':
      DATABASE_HOST = 'localhost';
      DATABASE_NAME = 'jull-io-db';
      break;
    
    default:
      break;
  }
  
  var DATABASE_URL = util.format(
    'mongodb://%s/%s', DATABASE_HOST, DATABASE_NAME);
  
  var connect = function() {
    var options = {
      server: { 
	socketOptions: { 
	  keepAlive: 1 
	} 
      },
    };
    
    if (DATABASE_USER && DATABASE_PASSWORD) {
      options.user = DATABASE_USER;
      options.password = DATABASE_PASSWORD;
    }
    
    db.connect(DATABASE_URL, options);
  };
  
  connect();
  
  db.connection.on('error', function(err) {
    console.log(err);
  });
  
  db.connection.on('disconnected', function() {
    connect();
  });
  
  /*
    Sessions configuration
  */
  var SESSION_ID_KEY
    , COOKIE_SECRET;

  switch(app.settings.env) {
    case 'production':
      SESSION_ID_KEY = process.env.SESSION_ID_KEY;
      COOKIE_SECRET = process.env.COOKIE_SECRET;
      break;
    
    case 'development':
      SESSION_ID_KEY = '_jull.io'
      COOKIE_SECRET = 'very secret string';
      break;

    default:
      break;
  }
  
  var cookieParser = express.cookieParser(COOKIE_SECRET)
    , sessionStore;
  
  sessionStore = new(mongoStore)({
    url: DATABASE_URL,
    collection: 'sessions'
  });
  
  /* 
     .bodyParser should be above .methodOverride
  */
  app.use(cookieParser);
  app.use(express.bodyParser())
  app.use(express.methodOverride());
  app.use(express.session({
    key: SESSION_ID_KEY,
    store: sessionStore,
    cookie: {
      httpOnly: true
    },
  }));
  
  /*
    Loading models
  */
  
  var apps = path.resolve('./app/');
  fs.readdirSync(apps).forEach(function(app) {
    var models = path.join(apps, app, 'models.js')
    
    if (fs.existsSync(models)) {
      require(models);
    }
  });

  /*
    Configuring passport
  */
  var User = db.model('User');
  passport.serializeUser(function(user, fn) {
    fn(null, user.id);
  });
  
  passport.deserializeUser(function(id, fn) {
    User.findOne({_id: id}, function(err, user) {
      fn(err, user);
    });
  });
    
  passport.use(new(LocalStrategy)({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, fn) {
    User.findOne({email: email}, function(err, user) {
      if (err) {
        fn(err);
	return;
      }
	
      if (!user || !user.authenticate(password)) {
        fn(null, false, {
	  message: 'email or password incorrect'
	});
	return;
      }
	
      fn(null, user);
    });
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  
  /*
    Adding favicon and serving compressed static files
  */
  app.use(express.favicon());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.compress({
    filter: function (req, res) {
      return /json|text|javascript|css/.test(res.getHeader('Content-Type'))
    },
    level: 9
  }));
  
  /*
    Configuring views dir and engine
  */
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade')
  
  app.use(app.router);
  
  /*
    Redis configuration, used by ascoltatori, socket.io and koa.
  */
  var REDIS_HOST
    , REDIS_PORT;
  
  switch(app.settings.env) {
    case 'production':
      REDIS_HOST = process.env.REDIS_HOST;
      REDIS_PORT = process.env.REDIS_PORT;
      break;
    
    case 'development':
      REDIS_HOST = 'localhost';
      REDIS_PORT = 6379;
      break;
    
    default:
      break;
  }
  
  var redisSettings = {
    type: 'redis',
    host: REDIS_HOST,
    port: REDIS_PORT
  };
  
  io = new(SessionSockets)(io, sessionStore, cookieParser, SESSION_ID_KEY)
  
  socket(io, redisSettings);
  store(redisSettings);

  ascoltatori.build(redisSettings, function(ascoltatore) {
    exports.ascoltatore = ascoltatore;
  });
  
};
