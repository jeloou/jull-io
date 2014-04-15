var mongoose = require('mongoose')
  , auth = require('../middlewares/authorization')
  , Device = mongoose.model('Device')
  , Phone = mongoose.model('Phone')
  , _ = require('underscore');

module.exports = (function(app) {
  app.post('/devices', auth.requiresLogin, function(req, res) {
    var device = req.body, phone;
    
    device.user = req.user;
    device = new(Device)(device);
    device.save(function(err) {
      if (err) {
	res.json(err);
	return;
      }
      res.json(device);
    });
  });
  
  app.get('/devices', auth.requiresLogin, function(req, res) {
    var user = req.user;
    
    Device.find({user: user}, function(err, devices) {
      if (err) {
	res.send(500, 'Something went wrong');
	return;
      }
      
      res.json(devices);
    });
  });
  
  app.get('/devices/:key', auth.requiresLogin, function(req, res) {
    var user, key;

    key = req.params.key;
    user = req.user;
    
    Device.findOne(
      {user: user, 'key.key': key}, function(err, device) {
	if (err) {
	  res.send(500, 'Something went wrong');
	  return;
	}
	
	if (!device) {
	  res.send(404, 'Oops, we could\'nt find that');
	  return;
	}
	
	res.json(device);
      });
  });

  app.put('/devices/:key', auth.requiresLogin, function(req, res) {
    var user, keys, key;
    
    user = req.user;
    key = req.params.key;
    
    Device.findOne(
      {user: user, 'key.key': key}, function(err, device) {
	var _device, keys = [
	  'name', 'description',
	];
	
	if (err) {
	  res.send(500, 'Something went wrong');
	  return;
	}
	
	if (!device) {
	  res.send(404, 'Oops, we could\'nt find that');
	  return;
	}
	
	_device = _.pick(req.body, keys);
	_device = _.chain(_device)
	  .pick(req.body, keys)
	  .pairs()
	  .filter(function(e) {
	    return device[e[0]] !== e[1];
	  }).value();
	
	if (_.isEmpty(_device)) {
	  res.send(304);
	  return;
	}
	
	_.each(_device, function(e) {
	  device[e[0]] = e[1];
	});
	  
	device.save(function(err) {
	  if (err) {
	    res.send(500, 'Something went wrong');
	    return;
	  }
	  res.json(device);
	});
      });
  });
  
  app.delete('/devices/:key', auth.requiresLogin, function(req, res) {
    var user, key;

    user = req.user;
    key = req.params.key;
    
    Device.findOne(
      {user: user, 'key.key': key}, function(err, device) {
	if (err) {
	  res.send(500, 'Something went wrong');
	  return;
	}
	
	if (!device) {
	  res.send(404, 'Oops, we could\'nt find that');
	  return;
	}
	
	device.remove(function(err) {
	  if (err) {
	    res.send(500, 'Something went wrong');
	    return;
	  }
	  
	  res.send(200);
	});
      });
  });
});