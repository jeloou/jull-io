var mongoose = require('mongoose')
  , User = mongoose.model('User');

module.exports = (function(app, passport) {
  app.post('/users/login', 
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.',
    }), function(req, res) {
      res.send('Welcome!');
  });
  
  app.post('/users', function(req, res) {
    var user = new User(req.body);
    user.save(function(err) {
      if (err) {
	res.send('That email is already taken');
	return;
      }
      res.send('Welcome!');
    });
  });

  app.get('/users/me', function(req, res) {
    res.send(req.user);
  });

});