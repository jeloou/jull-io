var db = require('mongoose');

var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  name: {type: String, trim: true, required: true},
  description: {type: String, trim: true, required: true},
  user: {type: ObjectId, ref: 'User', required: true},
  phone: {type: ObjectId, ref: 'Phone'},
  key: {type: ObjectId, ref: 'Key'},
});

var Device = db.model('Device', Schema);
Schema.pre('save', function(next) {
  var Key = db.model('Key'), that = this, key;
  
  key = new(Key);
  key.save(function(err) {
    if (err) {
      return next(err);
    }
    that.key = key;
    next();
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

