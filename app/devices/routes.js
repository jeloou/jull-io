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
});