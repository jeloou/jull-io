var db = require('mongoose')
  , uuid = require('node-uuid')
  , _ = require('underscore')._
  , isKey = require('../../lib/utils').isKey
  , handleError = require('../../lib/utils').handleError;

var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  name: {type: String, trim: true, required: true},
  description: {type: String, trim: true, required: true},
  user: {type: ObjectId, ref: 'User', required: true},
  key: db.Schema.Types.Mixed,
  radius: {type: Number, min: 0, default: 0},
  locationUpdated: {type: Boolean, default: false},
  location: {
    type: {type: String, default: 'Point'},
    coordinates: []
  }
});

Schema.index({
  location: '2dsphere'
});

Schema.methods.toJSON = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    user: this.user.toJSON(),
    key: {
      key: this.key.key,
      token: this.key.token
    }
  };
};

Schema.statics.add = function(args, fn) {
  var payload, thing;
  
  payload = args.payload;
  payload.user = args.user;
  
  payload.location = {
    type: 'Point',
    coordinates: [0, 0]
  };
  
  thing = new(this)(payload);
  thing.save(function(err) {
    if (err) {
      handleError(err, fn);
      return;
    }
    
    fn(null, thing);
  });
};

Schema.statics.get = function(args, fn) {
  var user, key;
  
  user = args.user;
  key = args.key;
  
  if (!isKey(key)) {
    fn({
      message: 'that doesn\'t look look like a valid key',
      code: 400
    });
    return;
  }
  
  this.findOne(
    {user: user, 'key.key': key}, function(err, thing) {
      if (err) {
	handleError(err, fn);
	return;
      }
      
      if (!thing) {
	fn({
	  message: 'Oops, we couldn\'t find that',
	  code: 404
	});
	return;
      }

      fn(null, thing);
    });
};

Schema.statics.fetch = function(args, fn) {
  var user, query;
  
  query = args.query;
  user = args.user;
  
  this
    .find({user: user})
    .populate('user')
    .exec(function(err, things) {
      if (err) {
	handleError(err, fn);
	return;
      }
      
      fn(null, things);
    });
};

Schema.statics.modify = function(args, fn) {
  var user, key, payload;
  
  user = args.user;
  payload = args.payload;
  key = args.key || payload.key;
  
  if (!isKey(key)) {
    fn({
      message: 'that doesn\'t look look like a valid key',
      code: 400
    });
    return;
  }

  this.findOne(
    {user: user, 'key.key': key}, function(err, thing) {
      var _thing, keys = [
	'name', 'description',
      ];
      
      if (err) {
	handleError(err, fn);
	return;
      }
      
      if (!thing) {
	fn({
	  message: 'Oops, we couldn\'t find that',
	  code: 404
	});
	return;
      }
      
      _thing = _.pick(payload, keys);
      _thing = _.chain(_thing)
	.pick(payload, keys)
	.pairs()
	.filter(function(e) {
	  return thing[e[0]] !== e[1];
	}).value();
      
      if (_.isEmpty(_thing)) {
	fn({code: 304});
	return;
      }
      
      _.each(_thing, function(e) {
	thing[e[0]] = e[1];
      });
      
      thing.save(function(err) {
	if (err) {
	  handleError(err, fn);
	  return;
	}
	fn(null, thing);
      });
    });
};

Schema.statics.remove = function(args, fn) {
  var user, key;
  
  user = args.user;
  key = args.key;
  
  if (!isKey(key)) {
    fn({
      message: 'that doesn\'t look look like a valid key',
      code: 400
    });
    return;
  }

  this.findOne(
    {user: user, 'key.key': key}, function(err, thing) {
      if (err) {
	handleError(err, fn);
	return;
      }
      
      if (!thing) {
	fn({
	  message: 'Oops, we couldn\'t find that',
	  code: 404
	});
	return;
      }
      
      thing.remove(function(err) {
	if (err) {
	  handleError(err, fn);
	  return;
	}
	
	fn(null);
      });
    });
};

Schema.statics.nearTo = function(thing, fn) {
  if (!thing.locationUpdated || thing.radius == 0) {
    fn(null, []);
    return;
  }
  
  this
    .where('locationUpdated', true)
    .where('location')
    .near({
      center: thing.location.coordinates,
      maxDistance: thing.radius,
      spherical: true
    })
    .select('_id')
    .exec(function(err, things) {
      if (err) {
	fn(err);
	return;
      }

      fn(null, things);
    });
};

var Thing = db.model('Thing', Schema);
Schema.pre('save', function(next) {
  var genCredentials, key, token, that = this;

  if (!this.isNew) {
    return next();
  }
  
  (genCredentials = function() {
    key = uuid.v1();
    token = genToken();
    
    Thing.find(
      {'key.key': key}, function(err, things) {
	if (err) {
	  next(err);
	  return;
	}

	if (things.length > 0) {
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
    {_id: this.user}, {$addToSet: {things: this.key.key}}, function(err) {
      if (err) {
	next(err);
      }
    }
  );
});

Schema.path('name').validate(function(name, fn) {
  if (this.isNew || this.isModified('name')) {
    Thing.find({name: name, user: this.user}).exec(function(err, things) {
      fn(!err && things.length == 0);
    });
  } else 
    fn(true);
}, 'Duplicated thing name');

function genToken() {
  var rand = function() {
    return Math.random().toString(36).substr(2); 
  };
  return rand() + rand();
}
