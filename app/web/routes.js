var auth = require('../middlewares/authorization');

module.exports = (function(app) {
  app.get('/', auth.requiresLogin, function(req, res) {
    res.render('home');
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