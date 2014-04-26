var db = require('mongoose');

module.exports = (function(io, ascoltatore) {
  io.on('connection', function(err, socket, session) {
    var Thing = db.model('Thing')
      , User = db.model('User')
      , user;
    
    if (!(user = session.passport.user)) {
      return;
    }
    
    socket.on('things', function() {
      var args = Array.prototype.slice.call(arguments);
      
      var fn = args.pop() || function() {}
        , data = args.shift();

      if (!data && typeof fn !== 'function') {
	data = fn;
	fn = function() {};
      }
      
      if (!data) {
	args = {
	  query: data,
	  user: user
	};

	Thing.fetch(
	  args, function(err, things) {
	    if (err) {
	      fn(err);
	      return;
	    }
	    
	    fn(null, things);
	  });
	return;
      }
      
      if (typeof data === 'string') {
	args = {
	  user: user,
	  key: data
	};

	Thing.get(
	  args, function(err, thing) {
	    if (err) {
	      fn(err);
	      return;
	    }
	    
	    fn(null, thing);
	  });
	return;
      }

      if (data !== Object(data) || Array.isArray(data) || Object.keys(data).length < 1) {
	fn('that doesn\'t look like a valid object');
	return;
      }
      
      if (typeof data.key === 'undefined') {
	args = {
	  payload: data,
	  user: user 
	};

	Thing.add(
	  args, function(err, thing) {
	    if (err) {
	      fn(err);
	      return;
	    }
	    
	    fn(null, thing);
	  }
	);
	return;
      }
      
      if (typeof data.changed !== 'undefined' && isBoolean(data.changed) && data.changed) {
	args = {
	  payload: data,
	  user: user
	};
	
	Thing.modify(
	  args, function(err, thing) {
	    if (err) {
	      res.send(err.code, err.message);
	      return;
	    }
	    
	    res.json(thing);
	  }
	);
	return;
      }
      
      if (typeof data.deleted !== 'undefined' && isBoolean(data.deleted) && data.deleted) {
	args = {
	  key: data.key,
	  user: user
	};
	
	Thing.remove(
	  args, function(err) {
	    if (err) {
	      fn(err);
	      return;
	    }

	    fn(null);
	  });
	return;
      }

      fn('seems like you did an invalid request');
      return;
    });
    
    socket.on('subscribe', function(key, fn) {
      fn = fn || function() {};
      
      if (typeof key !== 'string') {
	fn('that doesn\'t look like a valid key');
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

function isBoolean(obj) {
  return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
}