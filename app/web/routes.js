var auth = require('../middlewares/authorization');

module.exports = (function(app) {
  app.get('/', function(req, res) {
    if (!req.user) {
      res.render('landing', {
	title: 'jull.io – m2m instant messaging for moving things'
      });
      return;
    }
    
    res.render('home');
  });
  
  app.get('/signup', function(req, res) {
    if (req.user) {
      res.redirect('/');
      return;
    }
    
    res.render('signup');
  });

  app.get('/login', function(req, res) {
    if (req.user) {
      res.redirect('/');
      return;
    }
    
    res.render('login');
  });

  app.get('/logout', auth.requiresLogin, function(req, res) {
    req.logout();
    res.redirect('/');
  });
});