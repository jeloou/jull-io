var mongoose = require('mongoose')
  , auth = require('../middlewares/authorization')
  , Device = mongoose.model('Device')
  , Phone = mongoose.model('Phone');

module.exports = (function(app) {
  app.post('/devices', auth.requiresLogin, function(req, res) {
    var device = req.body, phone;
    
    phone = new(Phone)({
      user: req.user,
      number: device.phone
    });
    
    phone.save(function(err) {
      if (err) {
	return;
      }
      
      device.phone = phone._id;
      device.user = req.user;

      device = new(Device)(device);
      device.save(function(err) {
	if (err) {
	  phone.remove(function(err) {});
	  return;
	}
      });
    });
  });
});