var db = require('mongoose')
  , uuid = require('node-uuid');

var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  name: {type: String, trim: true, required: true},
  description: {type: String, trim: true, required: true},
  user: {type: ObjectId, ref: 'User', required: true},
  key: db.Schema.Types.Mixed,
});

var Device = db.model('Device', Schema);
Schema.pre('save', function(next) {
  var genCredentials, key, token, that = this;

  if (!this.isNew) {
    return next();
  }
  
  (genCredentials = function() {
    key = uuid.v1();
    token = genToken();
    
    Device.find(
      {'key.key': key}, function(err, devices) {
	if (err) {
	  next(err);
	  return;
	}

	if (devices.length > 0) {
	  genCredentials();
	  return;
	}

	that.key = {key: key, token: token};
	next();
      }
    );
  })();
});

Schema.post('save', function() {
  var User = db.model('User'), that = this;
  
  User.update(
    {_id: this.user}, {$addToSet: {devices: this.key.key}}, function(err) {
      if (err) {
	next(err);
      }
    }
  );
});

Schema.path('name').validate(function(name, fn) {
  if (this.isNew || this.isModified('name')) {
    Device.find({name: name, user: this.user}).exec(function(err, devices) {
      fn(!err && devices.length == 0);
    });
  } else 
    fn(true);
}, 'Duplicated device name');

function genToken() {
  var rand = function() {
    return Math.random().toString(36).substr(2); 
  };
  return rand() + rand();
}
