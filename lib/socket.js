var db = require('mongoose');

module.exports = (function(io, ascoltatore) {
  io.on('connection', function(err, socket, session) {
    var User = db.model('User'), user;
    
    if (!(user = session.passport.user)) {
      return;
    }
    
    socket.on('devices', function() {
      var args = Array.prototype.slice.call(arguments)
        , routes = devices.routes;
      
      var fn = args.pop() || function() {}
        , data = args.shift();

      if (!data && typeof fn !== 'function') {
	data = fn;
	fn = function() {};
      }
      
      if (!data) {
	fn(null, ['a', 'b', 'c']);
	return;
      }
      
      if (typeof data.key == 'undefined') {
	fn(null, 'created');
	return;
      }
      
      if (typeof data.deleted !== 'undefined' && data.deleted) {
	fn(null, 'deleted');
	return;
      }
      
      if (typeof data.changed !== 'undefined' && data.changed) {
	fn(null, 'updated');
	return;
      }
      
      fn(null, 'get one');
    });
    
    socket.on('subscribe', function(key, fn) {
      fn = fn || function() {};
      
      if (typeof key !== 'string') {
	fn('invalid device key');
	return;
      }

      if (key == 'master') {
	ascoltatore.subscribe('~user+'+user, function(user, packet) {
	  socket.emit('message', packet);
	});
	return;
      }
      
      User.findOne(
	{_id: user, devices: {$all: key}},  function(err, _user) {
	  if (err) {
	    fn('something went wrong');
	    return;
	  }
	  
	  if (!_user) {
	    fn('sorry, not authorized');
	    return;
	  }
	  
	  ascoltatore.subscribe(key, function(key, packet) {
	    socket.emit('message', packet);
	  });
	}
      );
    });
    
    socket.on('message', function(packet, fn) {
      var topics, payload, type;
      
      type = typeof packet.devices;
      fn = fn || function() {};
      
      if (type != 'object' && type != 'string') {
	fn('invalid devices especified');
	return;
      }
      
      if (type == 'object' && !packet.devices.length) {
	fn('no devices specified');
	return;
      }
      
      if (typeof packet.payload == 'undefined') {
	fn('invalid playload');
	return;
      }

      topics = packet.devices;
      payload = packet.payload;
      
      if (typeof topics == 'string') {
	topics = [topics];
      }
      
      User.findOne(
	{_id: user, devices: {$all: topics}},  function(err, _user) {
	  if (err) {
	    fn('something went wrong');
	    return;
	  }
	  
	  if (!_user) {
	    fn('not authorized, sorry');
	    return;
	  }
	  
	  topics.forEach(function(topic) {
	    ascoltatore.publish(
	      topic,
	      payload,
	      {},
	      function(a, b, c) {
		console.log('> packet send?');
	      }
	    );
	  });
	}
      );
    });
  });
});
