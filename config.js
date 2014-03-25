var express = require('express')
  , mongoose = require('mongoose')
  , mongoStore = require('connect-mongo')(express)
  , LocalStrategy = require('passport-local').Strategy
  , path = require('path')
  , fs = require('fs')
  , env = process.env.NODE_ENV || 'dev';

var config = {
  dev: { 
    db: 'mongodb://localhost/dev'
  },
  pro: {},
  test: {},
};

module.exports = function(app, passport) {
  var User, connect, app_path;

  connect = function() {
    var options = { server: { socketOptions: { keepAlive: 1 } } }
    mongoose.connect(config[env].db, options);
  };
  connect();

  // Error handler
  mongoose.connection.on('error', function (err) {
    console.log(err);
  });

  // Reconnect when closed
  mongoose.connection.on('disconnected', function () {
    connect();
  });
    
  app_path = path.resolve('./app/');
  fs.readdirSync(app_path).forEach(function(dir) {
    var module = path.join(app_path, dir, 'models.js');
    
    if (fs.existsSync(module)) {
      require(module);
    }
  });

  User = mongoose.model('User');
  
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
        return fn(err);
      }
	
      if (!user || !user.authenticate(password)) {
        return fn(null, false, {message: 'email or password incorrect'});
      }
	
      return fn(null, user);
    });
  }));
  
  app.use(express.compress({
    filter: function (req, res) {
      return /json|text|javascript|css/.test(res.getHeader('Content-Type'))
    },
    level: 9
  }));

  app.use(express.favicon());
  app.use(express.static(config.root + '/public'));

  app.set('views', './app/views');
  app.set('view engine', 'jade')

  app.configure(function () {
    // cookieParser should be above session
    app.use(express.cookieParser());
      
    // bodyParser should be above methodOverride
    app.use(express.bodyParser())
    app.use(express.methodOverride());

    // express/mongo session storage
    app.use(express.session({
      secret: 'App',
      store: new(mongoStore)({
	url: config[env].db,
	collection : 'sessions'
      })
    }));
  });

  app.use(passport.initialize());
  app.use(passport.session());
  
  app.use(app.router);
  app.use(function(err, req, res, next) {
    // treat as 404
    if (err.message
        && (~err.message.indexOf('not found')
	    || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    
    // log it
    // send emails if you want
    console.error(err.stack)
    
    // error page
    res.status(500).render('500', { error: err.stack })
  });
  
};