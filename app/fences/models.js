var db = require('mongoose')
  , _ = require('underscore')._
  , handleError = require('../../lib/utils').handleError
  , async = require('async');

var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  name: {type: String, trim: true, required: true},
  description: {type: String, trim: true, required: true},
  user: {type: ObjectId, ref: 'User', required: true},
  things: [{type: String, required: false, default: []}],
  boundaries: {
    type: {type: String, default: 'Polygon'},
    coordinates: []
  },
  contains: [{type: ObjectId, ref: 'Thing', default: []}]
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

Schema.statics.containing = function(thing, point, fn) {
  var that = this;
  
  this
    .where('boundaries')
    .intersects()
    .geometry({
      type: 'Point',
      coordinates: [point.lat, point.lng]
    })
    .select('_id')
    .exec(function(err, currentFences) {
      if (err) {
	fn(err);
	return;
      }
      
      that
	.where('contains')
	.all([thing.id])
	.select('_id')
	.exec(function(err, fences) {
	  if (err) {
	    fn(err);
	    return;
	  }
	  
	  currentFences = currentFences.map(function(obj) {
	    return ''+obj._id;
	  });
	  
	  fences = fences.map(function(obj) {
	    return ''+obj._id;
	  });
	  
	  async.parallel({
	    new: function(fn) {
	      var newFences = _.difference(currentFences, fences);
	      if (_.isEmpty(newFences)) {
		fn(null, null);
		return;
	      }
	      
	      that.collection.update(
		{_id: {
		  $in: newFences.map(function(id) { 
		    return db.Types.ObjectId(id);
		  })
		}},
		{$push: {
		  contains: db.Types.ObjectId(thing.id)
		}},
		function(err) {
		  if (err) {
		    fn(err);
		    return;
		  }
		  
		  fn(null, newFences.map(function(id) { 
		    return db.Types.ObjectId(id);
		  }));
		}
	      );
	    },
	    leaved: function(fn) {
	      var leavedFences = _.difference(fences, currentFences);
	      if (_.isEmpty(leavedFences)) {
		fn(null, null);
		return;
	      }
	      
	      that.collection.update(
		{_id: {
		  $in: leavedFences.map(function(id) { 
		    return db.Types.ObjectId(id);
		  })
		}},
		{$pull: {
		  contains: db.Types.ObjectId(thing.id)
		}},
		function(err) {
		  if (err) {
		    fn(err);
		    return;
		  }
		  
		  fn(null, leavedFences.map(function(id) {
		    return db.Types.ObjectId(id);
		  }));
		}
	      );
	    }
	  },
          function(err, res) {
	    console.log(res);
	    if (err) {
	      fn(err);
	      return;
	    }
	    
	    fn(null, res.new, res.leaved);
	  });
	});
    });
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
    if (err) {
      handleError(err, fn);
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
	handleError(err, fn);
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
      handleError(err, fn);
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
	handleError(err, fn);
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
      
      fence.save(function(err) {
	if (err) {
	  handleError(err, fn);
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
	handleError(err, fn);
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
	  handleError(err, fn);
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
  
  if (things.length < 1) {
    fn(true);
    return;
  }
  
  User.owns(this.user, things, function(err, owns) {
    if (err) {
      fn(false);
      return;
    }
    
    fn(owns);
  });
}, 'One or more things are invalid');

Schema.path('boundaries.coordinates').validate(function(coordinates) {
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
