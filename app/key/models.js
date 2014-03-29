var db = require('mongoose')
  , uuid = require('node-uuid');

var Schema = new(db.Schema)({
  key: {type: String},
  token: {type: String},
});

var Key = db.model('Key', Schema);
Schema.pre('save', function(next) {
  var genCredentials, key, token, that = this;

  (genCredentials = function() {
    key = uuid.v1();
    token = genToken();
    
    Key.find({key: key, token: token}).exec(function(err, keys) {
      if (err) {
	return next(err)
      }
      
      if (keys.length > 0) {
	return genCredentials();
      }
      
      that.key = key;
      that.token = token;
      next();
    });
  })();
});

function genToken() {
  var rand = function() {
    return Math.random().toString(36).substr(2); 
  };
  return rand() + rand();
}