var db = require('mongoose')
  , auth = require('../middlewares/authorization')
  , Thing = db.model('Thing');

module.exports = (function(app) {
  app.post('/things', auth.requiresLogin, function(req, res) {
    var args;
    
    args = {
      user: req.user._id,
      payload: req.body
    };
    
    Thing.add(
      args, function(err, thing) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}

	res.json(thing);
      }
    )
  });
  
  app.get('/things/:key', auth.requiresLogin, function(req, res) {
    var args;
    
    args = {
      key: req.params.key,
      user: req.user
    };
    
    Thing.get(
      args, function(err, thing) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}
	
	res.json(thing);
      });
  });
  
  app.get('/things', auth.requiresLogin, function(req, res) {
    var args;

    args = {
      user: req.user._id,
      query: req.query
    };
    
    Thing.fetch(
      args, function(err, things) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}
	
	res.json(things);
      });
  });

  app.put('/things/:key', auth.requiresLogin, function(req, res) {
    var args;

    args = {
      user: req.user,
      key: req.params.key,
      payload: req.body
    };
    
    Thing.modify(
      args, function(err, thing) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}

	res.json(thing);
      }
    );
  });

  app.delete('/things/:key', auth.requiresLogin, function(req, res) {
    var args; 
    
    args = {
      user: req.user,
      key: req.params.key
    };

    Thing.remove(
      args, function(err) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}

	res.send(200);
      });
  });
});
