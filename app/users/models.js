
var mongoose = require('mongoose')
  , crypto = require('crypto')
  , oAuthTypes = ['twitter', 'facebook'];

var UserSchema = new(mongoose.Schema)({
  name: {type: String, default: ''},
  email: {type: String, default: ''},
  hash: {type: String, default: ''},
  salt: {type: String, default: ''},
});

UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.genSalt();
    this.hash = this.genHash(password);
  })
  .get(function() { 
      return this._password;
  });
   
UserSchema.methods = {
  authenticate: function(password) {
    return this.genHash(password) == this.hash;
  },
  genSalt: function() {
    return crypto.randomBytes(64)
                 .toString('base64');
  },
  genHash: function(password) {
    return crypto.pbkdf2Sync(password, this.salt, 10000, 128)
                 .toString('base64');
  },
};

mongoose.model('User', UserSchema);