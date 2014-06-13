var db = require('mongoose')
  , auth = require('../middlewares/authorization')
  , Fence = db.model('Fence');

module.exports = (function(app) {
  app.post('/fences', auth.requiresLogin, function(req, res) {
    var args;
    
    args = {
      user: req.user._id,
      data: req.body
    };
    
    Fence.add(
      args, function(err, fence) {
	if (err) {
	  res.json(err.code, err);
	  return;
	}
	
	res.json(fence.toJSON());
      }
    );
  });
  
  app.get('/fences/:id', auth.requiresLogin, function(req, res) {
    var args;
    
    args = {
      id: req.params.id,
      user: req.user
    };

    Fence.get(
      args, function(err, fence) {
	if (err) {
	  res.json(err.code, err);
	  return;
	}
	
	res.json(fence.toJSON());
      }
    );
  });
  
  app.get('/fences', auth.requiresLogin, function(req, res) {
    var args;

    args = {
      user: req.user._id,
      query: req.query
    };
    
    Fence.fetch(
      args, function(err, fences) {
	if (err) {
	  res.json(err.code, err);
	  return;
	}

	res.json(fences.map(function(fence) {
	  return fence.toJSON();
	}));
      }
    );
  });
  
  app.put('/fences/:id', auth.requiresLogin, function(req, res) {
    var args;
    
    args = {
      user: req.user,
      id: req.params.id,
      data: req.body
    };
    
    Fence.modify(
      args, function(err, fence) {
	if (err) {
	  res.json(err.code, err);
	  return;
	}

	res.json(fence.toJSON());
      }
    );
  });
  
  app.delete('/fences/:id', auth.requiresLogin, function(req, res) {
    var args;
    
    args = {
      id: req.params.id,
      user: req.user
    };
    
    Fence.remove(
      args, function(err) {
	if (err) {
	  res.json(err.code, err);
	  return;
	}

	res.status(200).json();
      }
    );
  });
});