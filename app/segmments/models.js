var db = require('mongoose')
  , moment = require('moment');

const R = 6378137
    , DEG_TO_RAD = Math.PI/180;

function distanceBetween() {
  var points = Array.prototype.slice.call(arguments)
    , distance = 0;

  var a, b, i = 0;
  while (i < points.length) {
    if (i == points.length-1) {
      return distance;
    }

    a = points[i];
    b = points[i+1];

    var sin1 = Math.sin(((b.lat - a.lat) * DEG_TO_RAD)/2)
      , sin2 = Math.sin(((b.lng - a.lng) * DEG_TO_RAD)/2);
    
    var v = Math.pow(sin1, 2) + Math.pow(sin2, 2) * Math.cos(a.lat * DEG_TO_RAD) * Math.cos(b.lat * DEG_TO_RAD);
    distance += 2 * R * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v));

    i++;
  }
}

function durationBetween() {
  var dates = Array.prototype.slice.call(arguments)
    , duration = 0;
  
  var a, b, i = 0;
  while (i < dates.length) {
    if (i == dates.length-1) {
      return duration;
    }
    
    a = dates[i];
    b = dates[i+1];
    
    duration += Math.abs(a - b)/1000;
    i++;
  }
}

var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  type: {type: String, enum: ['move', 'stop']},
  thing: {type: ObjectId, ref: 'Thing', required: true},
  points: [{
    lat: Number,
    lng: Number,
    at: Date,
    events: [{
      event: {type: String},
      _readings: db.Schema.Types.Mixed
    }]
  }],
  distance: {type: Number, default: 0},
  duration: {type: Number, default: 0},
  start: Date,
  end: Date,
  updated: Date,
});

Schema.statics._parseEvents = function(events) {
  return events.map(function(event) {
    var _event = {
      _readings: {}
    };
    
    for (var k in event) {
      if (k !== 'event') {
	_event._readings[k] = event[k];
	continue;
      }
      _event.event = event[k];
    }
    
    return _event;
  });
};

Schema.statics.add = function(args, fn) {
  var payload, user, thing, that = this;
  
  payload = args.payload;
  thing = args.thing;
  user = args.user;
  
  var last = args.last || null
    , events = [];

  if (typeof payload.events !== 'undefined') {
    events = this._parseEvents(payload.events);
  }
  
  var segmment = {
    type: args.type || 'stop',
    points: [{
      lat: payload.lat, 
      lng: payload.lng, 
      events: events,
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

  var events = [];
  if (typeof payload.events !== 'undefined') {
    events = this._parseEvents(payload.events);
  }
  
  var Segmment = db.model('Segmment')
    , last = segmment.points[0]
    , point = {
        lat: payload.lat
      , lng: payload.lng
      , events: events
      , at: new(Date)(args.at)
    };
  
  var distance = segmment.distance
    , duration = segmment.duration;

  distance += distanceBetween(last, point);
  duration += durationBetween(last.at, point.at);
  
  Segmment.collection.update(
    {_id: segmment._id},
    {$push: {
      points: point
    },
     $set: {
       distance: distance, 
       duration: duration
     }
    },
    function(err) {
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
	.select('_id type start distance duration')
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
	  
	  if (!moment(args.at).isSame(segmment.start, 'day')) {
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