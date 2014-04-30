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
  start: Date,
  end: Date,
  updated: Date,
});

db.model('Segmment', Schema);


