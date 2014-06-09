var db = require('mongoose')
  , _ = require('underscore')._;

var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  name: {type: String, trim: true, required: true},
  description: {type: String, trim: true, required: true},
  user: {type: ObjectId, ref: 'User', required: true},
  things: [{type: String}],
  boundaries: {
    type: {type: String, default: 'Polygon'},
    coordinates: []
  }
});

Schema.index({
  boundaries: '2dsphere'
});

Schema.methods.toJSON = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    user: this.user,
    things: this.things,
    boundaries: this.boundaries.coordinates.pop()
  };
};

Schema.statics.add = function(args, fn) {
  var data, fence;

  data = args.data;
  data.user = args.user;
  
  if (typeof data.boundaries !== 'undefined') {
    data.boundaries = {
      type: {type: 'Polygon'},
      coordinates: [data.boundaries]
    };
  }
  
  fence = new(this)(data);
  fence.save(function(err) {
    console.log(err);
    if (err) {
      fn({
	message: 'Something went wrong',
	code: 500
      });
      return;
    }

    fn(null, fence);
  });
};

Schema.statics.get = function(args, fn) {
  var user, id;
  
  user = args.user;
  id = args.id;

  this.findOne(
    {_id: id, user: user}, function(err, fence) {
      if (err) {
	fn({
	  message: 'Something went wrong',
	  code: 500
	});
	return;
      }
      
      if (!fence) {
	fn({
	  message: 'Oops, we couldn\'t find that',
	  code: 404
	});
	return;
      }

      fn(null, fence);
    });
};

Schema.statics.fetch = function(args, fn) {
  var user, query;
  
  query = args.query;
  user = args.user;
  
  this.find({user: user}).exec(function(err, fences) {
    if (err) {
      fn({
	message: 'Something went wrong',
	code: 500
      });
      return;
    }

    fn(null, fences);
  });
};

Schema.statics.modify = function(args, fn) {
  var user, id, data;

  user = args.user;
  data = args.data;
  id = args.id;
  
  this.findOne(
    {_id: id, user: user}, function(err, fence) {
      var _fence, keys = [
	'name', 'description'
      ];
      
      if (err) {
	fn({
	  message: 'something went wrong',
	  code: 500
	});
	return;
      }
      
      if (!fence) {
	fn({
	  message: 'Oops, we couldn\'t find that',
	  code: 404
	});
	return;
      }
      
      _fence = _.pick(data, keys);
      _fence = _.chain(_fence)
	.pick(data, keys)
	.pairs()
	.filter(function(e) {
	  return fence[e[0]] !== e[1];
	}).value();

      if (_.isEmpty(_fence)) {
	fn({
	  code: 304
	});
	return;
      }

      _.each(_fence, function(e) {
	fence[e[0]] = e[1];
      });
      
      console.log('fence: ', fence);
      fence.save(function(err) {
	if (err) {
	  fn({
	    message: 'something went wrong',
	    code: 500
	  });
	  return;
	}
	fn(null, fence);
      });
    }
  );
};

Schema.statics.remove = function(args, fn) {
  var user, id;
  
  user = args.user;
  id = args.id;
  
  this.findOne(
    {_id: id, user: user}, function(err, fence) {
      if (err) {
	fn({
	  message: 'something went wrong',
	  code: 500
	});
	return;
      }
      
      if (!fence) {
	fn({
	  message: 'Oops, we couldn\'t find that',
	  code: 404
	});
	return;
      }
      
      fence.remove(function(err) {
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

var Fence = db.model('Fence', Schema);
Schema.path('name').validate(function(name, fn) {
  if (this.isNew || this.isModified('name')) {
    Fence
      .find({name: name, user: this.user})
      .exec(function(err, fences) {
	fn(!err && fences.length == 0);
      });
  } else {
    fn(true);
  }
}, 'Duplicated fence name');

Schema.path('things').validate(function(things, fn) {
  var User = db.model('User');
  console.log(this.user);
  User
    .findOne({
      _id: this.user,
      things: {$all: things}
    })
    .select('_id')
    .exec(function(err, user) {
      console.log('user: ', user);
      if (err) {
	fn(false);
	return;
      }
      
      fn(user !== null);
    });
}, 'One or more things are invalid');

Schema.path('boundaries.coordinates').validate(function(coordinates) {
  console.log('this.isModified(\'name\'): ', this.isModified('name'));
  if (!(coordinates.length > 0)) {
    return false;
  }
  
  coordinates = coordinates.pop();
  if (!(_.isArray(coordinates) && coordinates.length > 3)) {
    return false;
  }
  
  if (!_.every(coordinates, function(latlng) {
    if (latlng.length == 2) {
      return (_.isNumber(latlng[0]) && _.isNumber(latlng[1]));
    }
    return false;
  })) {
    return false;
  };
  
  if (!_.isEqual(_.first(coordinates), _.last(coordinates))) {
    return false;
  }
  
  this.boundaries.coordinates = [coordinates];
  return true;
}, 'Invalid boundaries');
