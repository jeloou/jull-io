var db = require('mongoose');

var ObjectId = db.Schema.ObjectId;
var Schema = new(db.Schema)({
  type: {type: String, enum: ['move', 'stop']},
  thing: {type: ObjectId, ref:'Thing', required: true},
  points: [{
    lat: Number,
    lng: Number,
    at: Date
  }],
  distance: Number,
  duration: Number,
  start: Date,
  end: Date,
  updated: Date,
});

Schema.statics.add = function(args, fn) {
  var payload, user;
  
  payload = args.payload;
  user = args.user;

  fn();
};

Schema.statics.modify = function(args, fn) {
  var payload, user, id;

  payload = args.payload;
  user = args.user;
  id = args.id;
  
  fn();
};

db.model('Segmment', Schema);
