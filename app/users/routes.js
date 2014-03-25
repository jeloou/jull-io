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
        return res.render('users/signup', {
	  error: utils.errors(err.errors),
	  user: user,
	  title: 'Sign up'
	});
      }
      /*
	req.logIn(user, function(err) {
	if (err) return next(err)
	return res.redirect('/')
	})
      */
    });
  });

  app.get('/users/me', function(req, res) {
    res.send(req.user);
  });

});