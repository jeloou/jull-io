var util = require('util')
  , _ = require('underscore')._;

var messages = {
  'enum': '%s not an allowed value',
  'required': '%s is required',
  'min': '%s below minimum',
  'max': '%s above maximum'
};

exports.handleError = function(err, fn) {
  var errors = {};
  
  if (err.name !== 'ValidationError') {
    fn({
      message: 'Something went wrong',
      code: 500
    });
    return;
  }
  
  _.each(err.errors, function(v, k) {
    if (!messages.hasOwnProperty(v.type)) {
      errors[k] = v.type;
      return;
    }
    
    errors[k] = util.format(
      messages[v.type], 
      v.path
    );
  });
  
  fn({
    message: 'Validation failed',
    code: 400,
    errors: errors
  });
};

exports.isKey = function(obj) {
  if (toString.call(obj) === '[object String]') {
    if (obj === 'master') {
      return true;
    }
    
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(obj)) {
      return true;
    }
  }
  return false;
};

exports.isPacket = function(obj) {
  if (toString.call(obj) !== '[object Object]' || Object.keys(obj).length < 2) {
    return false;
  }
  
  if (toString.call(obj.things) !== '[object String]') {
    if (!Array.isArray(obj.things) || obj.things.length < 1) {
      return false;
    }
  }
  
  if (toString.call(obj.payload) !== '[object Object]') {
    return false;
  }
  return true;
};