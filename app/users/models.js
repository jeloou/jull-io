
var db = require('mongoose')
  , crypto = require('crypto')
  , _ = require('underscore')._;

var Schema = new(db.Schema)({
  first_name: {type: String, trim: true},
  last_name: {type: String, trim: true},
  email: {type: String, lowercase: true, trim: true, default: ''},
  hash: {type: String, default: ''},
  salt: {type: String, default: ''},
  things: [{type: String}]
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

Schema.statics.add = function(data, fn) {
  var user;

  user = new(this)(data);
  user.save(function(err) {
    if (err) {
      fn.call({}, {
	message: 'Bad input parameters',
	errors: err,
	code: 400
      });
      return;
    }
    
    fn.call(user, null, user);
  });
};

Schema.statics.owns = function(user, keys, fn) {
  if (_.isString(keys)) {
    keys = [keys];
  }
  
  this.findOne(
    {_id: user, things: {$all: keys}}, function(err, user) {
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

Schema.methods.authenticate = function(password) {
  return this.genHash(password) == this.hash;
};

Schema.methods.genSalt = function() {
  return crypto.randomBytes(64).toString('base64');
};
  
Schema.methods.genHash = function(password) {
  return crypto
    .pbkdf2Sync(password, this.salt, 10000, 128)
    .toString('base64');
};

Schema.methods.toJSON = function() {
  return {
    first_name: this.first_name,
    last_name: this.last_name,
    email: this.email,
    things: this.things
  };
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
