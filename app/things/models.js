var db = require('mongoose')
  , uuid = require('node-uuid')
  , _ = require('underscore')._;

var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  name: {type: String, trim: true, required: true},
  description: {type: String, trim: true, required: true},
  user: {type: ObjectId, ref: 'User', required: true},
  key: db.Schema.Types.Mixed,
});


Schema.statics.add = function(args, fn) {
  var payload;
  
  payload = args.payload;
  payload.user = args.user;
  
  thing = new(this)(payload);
  thing.save(function(err) {
    if (err) {
      fn({
	message: 'Something went wrong',
	code: 500
      });
      return;
    }
    
    fn(null, thing);
  });
};

Schema.statics.get = function(args, fn) {
  var user, key;
  
  user = args.user;
  key = args.key;
  
  this.findOne(
    {user: user, 'key.key': key}, function(err, thing) {
      if (err) {
	fn({
	  message: 'Something went wrong',
	  code: 500
	});
	return;
      }
      
      if (!thing) {
	fn({
	  message: 'Oops, we could\'nt find that',
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
  
  this.find({user: user}, function(err, things) {
    if (err) {
      fn({
	message: 'Something went wrong',
	code: 500
      });
      return;
    }
    
    fn(null, things);
  });
};

Schema.statics.modify = function(args, fn) {
  var user, key, payload;
  
  user = args.user;
  key = args.key;
  payload = args.payload;

  this.findOne(
    {user: user, 'key.key': key}, function(err, thing) {
      var _thing, keys = [
	'name', 'description',
      ];
      
      if (err) {
	fn({
	  message: 'something went wrong',
	  code: 500
	});
	return;
      }
      
      if (!thing) {
	fn({
	  message: 'Oops, we could\'nt find that',
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
	  fn({
	    message: 'something went wrong',
	    code: 500
	  });
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
  
  this.findOne(
    {user: user, 'key.key': key}, function(err, thing) {
      if (err) {
	fn({
	  message: 'something went wrong',
	  code: 500
	});
	return;
      }
      
      if (!thing) {
	fn({
	  message: 'Oops, we could\'nt find that',
	  code: 404
	});
	return;
      }
      
      thing.remove(function(err) {
	if (err) {
	  fn({
	    message: 'something went wrong',
	    code: 500
	  });
	  return;
	}
	
	fn(null);
      });
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
