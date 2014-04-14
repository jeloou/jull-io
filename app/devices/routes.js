var mongoose = require('mongoose')
  , auth = require('../middlewares/authorization')
  , Device = mongoose.model('Device')
  , Phone = mongoose.model('Phone');

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
});