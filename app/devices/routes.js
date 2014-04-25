var mongoose = require('mongoose')
  , auth = require('../middlewares/authorization')
  , Device = mongoose.model('Device')
  , Phone = mongoose.model('Phone')
  , _ = require('underscore');

routes = module.routes = {};
routes.get = function(data, fn) {
  var user, key;
  
  user = data.user;
  key = data.key;
  
  Device.findOne(
    {user: user, 'key.key': key}, function(err, device) {
      if (err) {
	fn({
	  message: 'Something went wrong',
	  code: 500
	});
	return;
      }
      
      if (!device) {
	fn({
	  message: 'Oops, we could\'nt find that',
	  status: 404
	});
	return;
      }

      fn(null, device);
    });
};

routes.fetch = function(data, fn) {
  var user, query;
  
  query = data.query;
  user = data.user;
  
  Device.find({user: user}, function(err, devices) {
    if (err) {
      fn({
	message: 'Something went wrong',
	code: 500
      });
      return;
    }
    
    fn(null, devices);
  });
};

routes.post = function(data, fn) {
  device = new(Device)(data);
  device.save(function(err) {
    if (err) {
      fn({
	message: 'Something went wrong',
	code: 500
      });
      return;
    }
    
    fn(null, device);
  });
};

routes.put = function(data, fn) {
  var user, key, payload;
  
  user = data.user;
  key = data.key;
  payload = data.payload;

  Device.findOne(
    {user: user, 'key.key': key}, function(err, device) {
      var _device, keys = [
	'name', 'description',
      ];
      
      if (err) {
	fn({
	  message: 'something went wrong',
	  code: 500
	});
	return;
      }
      
      if (!device) {
	fn({
	  message: 'Oops, we could\'nt find that',
	  code: 404
	});
	return;
      }
      
      _device = _.pick(payload, keys);
      _device = _.chain(_device)
	.pick(payload, keys)
	.pairs()
	.filter(function(e) {
	  return device[e[0]] !== e[1];
	}).value();
      
      if (_.isEmpty(_device)) {
	fn({code: 304});
	return;
      }
      
      _.each(_device, function(e) {
	device[e[0]] = e[1];
      });
      
      device.save(function(err) {
	if (err) {
	  fn({
	    message: 'something went wrong',
	    code: 500
	  });
	  return;
	}
	fn(null, device);
      });
    });
};

routes.delete = function(data, fn) {
  var user, key;
    
  user = data.user;
  key = data.key;
  
  Device.findOne(
    {user: user, 'key.key': key}, function(err, device) {
      if (err) {
	fn({
	  message: 'something went wrong',
	  code: 500
	});
	return;
      }
      
      if (!device) {
	fn({
	  message: 'Oops, we could\'nt find that',
	  code: 404
	});
	return;
      }
      
      device.remove(function(err) {
	if (err) {
	  fn({
	    message: 'something went wrong',
	    code: 500
	  });
	  return;
	}
	
	fn(null);
      });
    });
};

module.apply = function(app) {
  app.post('/devices', auth.requiresLogin, function(req, res) {
    var data = req.body;
    
    routes.post(
      data, function(err, device) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}

	res.json(device);
      }
    )
  });
  
  app.get('/devices/:key', auth.requiresLogin, function(req, res) {
    var data;

    data = {
      key: req.params.key,
      user: req.user
    };
    
    routes.get(
      data, function(err, device) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}
	
	res.json(device);
      });
  });
  
  app.get('/devices', auth.requiresLogin, function(req, res) {
    var data;

    data = {
      query: req.params,
      user: req.user
    };

    routes.fetch(
      data, function(err, devices) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}
	
	res.json(devices);
      });
  });

  app.put('/devices/:key', auth.requiresLogin, function(req, res) {
    var data;

    data = {
      user: req.user,
      key: req.params.key,
      payload: req.body
    };
    
    routes.put(
      data, function(err, device) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}

	res.json(device);
      }
    );
  });

  app.delete('/devices/:key', auth.requiresLogin, function() {
    var data; 

    data = {
      user: req.user,
      key: req.params.key
    };

    routes.delete(
      data, function(err) {
	if (err) {
	  res.send(err.code, err.message);
	  return;
	}

	res.send(200);
      });
  });
};
