var db = require('mongoose');

var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  name: {type: String, trim: true, required: true},
  description: {type: String, trim: true, required: true},
  user: {type: ObjectId, ref: 'User', required: true},
  key: {type: ObjectId, ref: 'Key'},
});

var Device = db.model('Device', Schema);
Schema.pre('save', function(next) {
  var key, that = this;
  
  if (!this.isNew) {
    return next();
  }
  
  key = new(db.model('Key'));
  key.save(function(err) {
    if (err) {
      return next(err);
    }
    that.key = key;
    next();
  });
});

Schema.post('save', function() {
  var User = db.model('User'), that = this;
  
  this.populate('key', function(err) {
    if (err) {
      throw err;
    }
    
    User.update(
      {_id: that.user}, {$addToSet: {devices: that.key.key}}, function(err) {
	if (err) {
	  throw err
	}
      });
  });
});

Schema.path('name').validate(function(name, fn) {
  if (this.isNew || this.isModified('name')) {
    Device.find({name: name, user: this.user}).exec(function(err, devices) {
      fn(!err && devices.length == 0);
    });
  } else 
    fn(true);
}, 'Duplicated device name');

