var _ = require('underscore')._;

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