var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , auth = require('../middlewares/authorization');

module.exports = (function(app, passport) {
  app.post('/users/login', 
    passport.authenticate('local', {
      failureRedirect: '/login',
    }), function(req, res) {
      res.redirect('/');
  });
  
  app.post('/users', function(req, res) {
    if (req.user) {
      res.status(403).json();
      return;
    }
    
    User.add(req.body, function(err) {
      var that = this;
      
      if (err) {
	res.json(err.code, err);
	return;
      }
      
      req.login(this, function(err) {
	res.json(that.toJSON());
      });
    });
  });
  
  app.get('/users/me', auth.requiresLogin, function(req, res) {
    res.json(req.user.toJSON());
  });
});