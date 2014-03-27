var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.ObjectId;
var PhoneSchema = new(mongoose.Schema)({
  number: {type: String, trim: true, required: true},
  user: {type: ObjectId, ref: 'User'},
  verified: {type: Boolean, default: false},
  code: {type: Number},
});

var Phone = mongoose.model('Phone', PhoneSchema);
PhoneSchema.path('number').validate(function(number, fn) {
  if (this.isNew || this.isModified('number')) {
    Phone.find({number: number}).exec(function(err, phones) {
      fn(!err && phones.length === 0);
    });
  } else
    fn(true);
}, 'Phone number already taken');

PhoneSchema.pre('save', function(next) {
  if (this.isNew) {
    this.code = Math.floor(Math.random() * 9999);
    /* send a SMS */
  }
  next();
});




