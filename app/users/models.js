
var db = require('mongoose')
  , crypto = require('crypto')
  , _ = require('underscore')._;

var Schema = new(db.Schema)({
  name: {type: String, trim: true, default: ''},
  email: {type: String, lowercase: true, trim: true, default: ''},
  hash: {type: String, default: ''},
  salt: {type: String, default: ''},
  devices: [{type: String}],
});

Schema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.genSalt();
    this.hash = this.genHash(password);
  })
  .get(function() { 
      return this._password;
  });

Schema.statics.owns = function(user, keys, fn) {
  if (_.isString(keys)) {
    keys = [keys];
  }
  
  this.findOne(
    {_id: user, devices: {$all: keys}}, function(err, user) {
      if (err) {
	fn({
	  message: 'something went wrong',
	  code: 500
	});
	return;
      }
      
      fn(null, user !== null);
    }
  );
};

Schema.methods = {
  authenticate: function(password) {
    return this.genHash(password) == this.hash;
  },
  genSalt: function() {
    return crypto.randomBytes(64)
                 .toString('base64');
  },
  genHash: function(password) {
    return crypto.pbkdf2Sync(password, this.salt, 10000, 128)
                 .toString('base64');
  },
};

var User = db.model('User', Schema);
Schema.path('email').validate(function(email, fn) {
  if (this.isNew || this.isModified('email')) {
    User.find({ email: email }).exec(function(err, users) {
      fn(!err && users.length == 0);
    });
  } else 
    fn(true);
}, 'Email alredy taken');
