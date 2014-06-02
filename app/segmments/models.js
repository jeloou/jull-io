var db = require('mongoose')
  , moment = require('moment');


var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  type: {type: String, enum: ['move', 'stop']},
  thing: {type: ObjectId, ref: 'Thing', required: true},
  points: [{
    lat: Number,
    lng: Number,
    at: Date
  }],
  distance: {type: Number, default: 0},
  duration: {type: Number, default: 0},
  start: Date,
  end: Date,
  updated: Date,
});

Schema.statics.add = function(args, fn) {
  var payload, user, thing, that = this;
  
  payload = args.payload;
  thing = args.thing;
  user = args.user;
  
  var last = args.last || null;
  var segmment = {
    type: args.type || 'stop',
    points: [{
      lat: payload.lat, 
      lng: payload.lng, 
      at: args.at
    }],
    start: last? last.at: args.at,
    end: args.at,
    updated: args.at
  };

  if (last && segmment.type == 'move') {
    segmment.points.unshift(last);
  }
  
  var Thing = db.model('Thing');
  Thing.findOne(
    {'key.key': thing}).select('_id').exec(function(err, thing) {
      if (err) {
	fn({
	  message: 'something went wrong',
	  code: 500
	});
	return;
      }
      
      segmment.thing = thing._id;
      segmment = new(that)(segmment);
      segmment.save(function(err) {
	if (err) {
	  fn({
	    message: 'something went wrong',
	    code : 500
	  });
	  return;
	}
	
	fn(null, segmment);
      });
    });
};

Schema.statics.modify = function(args, fn) {
  var segmment, payload, user;

  segmment = args.segmment;
  payload = args.payload;
  user = args.user;

  if (segmment.type == 'stop') {
    segmment.points[0].at = args.at;
    segmment.save(function(err) {
      if (err) {
	fn(err);
	return;
      }
      
      fn(null);
    });
    return;
  }
  
  var Segmment = db.model('Segmment')
    , point = {
        lat: payload.lat
      , lng: payload.lng
      , at: new(Date)(args.at)
    };
  
  Segmment.collection.update(
    {_id: segmment._id}, {$push: {points: point}}, function(err) {
      if (err) {
	fn(err);
	return;
      }
      
      fn(null);
    });
};

Schema.statics.last = function(args, fn) {
  var thing = args.thing, that = this;
  
  var Thing = db.model('Thing');
  Thing.findOne(
    {'key.key': thing}).select('_id').exec(function(err, thing) {
      that
        .find({thing: thing._id}, {points: {$slice: -1}})
	.sort('-end')
	.select('_id type')
	.limit(1)
	.exec(function(err, segmments) {
	  var segmment, payload;
	  
	  if (err) {
	    fn(err);
	    return;
	  }
	  
	  segmment = segmments.pop();
	  if (!segmment) {
	    fn(null, null);
	    return;
	  }
	  
	  last = segmment.points[0];
	  payload = args.payload;
	  
	  if (last.lat == payload.lat && last.lng == payload.lng) {
	    if (segmment.type === 'move') {
	      args.type = 'stop';
	      args.last = last;

	      fn(null, null);
	      return;
	    }
	    
	    fn(null, segmment);
	    return;
	  }

	  if (segmment.type === 'stop') {
	    args.type = 'move';
	    args.last = last;
	    
	    fn(null, null);
	    return;
	  }
	  
	  fn(null, segmment);
	});
    });
};

db.model('Segmment', Schema);
Schema.pre('save', function(next) {
  var now;
  
  if (!this.isNew) {
    this.updated = moment.utc().format();
    this.save();
  }
  
  next();
});