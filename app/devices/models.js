var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.ObjectId;
var DeviceSchema = new(mongoose.Schema)({
  name: {type: String, trim: true, required: true},
  description: {type: String, trim: true, required: true},
  user: {type: ObjectId, ref: 'User', required: true},
  phone: {type: ObjectId, ref: 'Phone'},
  key: {type: ObjectId, ref: 'Key'},
});

var Device = mongoose.model('Device', DeviceSchema);
DeviceSchema.path('name').validate(function(name, fn) {
  if (this.isNew || this.isModified('name')) {
    Device.find({name: name, user: this.user}).exec(function(err, devices) {
      fn(!err && devices.length == 0);
    });
  } else 
    fn(true);
}, 'Duplicated device name');