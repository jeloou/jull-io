
exports.requiresLogin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  
  if (req.xhr) {
    res.json(401, {
      message: 'You aren\'t authenticated',
      code: 401
    });
    return;
  }
  
  if (req.method == 'GET') {
    req.session.returnTo = req.originalUrl;
  }
  
  res.redirect('/login');
};