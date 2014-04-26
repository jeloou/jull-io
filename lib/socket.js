var db = require('mongoose')
  , _ = require('underscore')._
  , utils = require('./utils')

var isPacket = utils.isPacket
  , isKey = utils.isKey;

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

      if (!data && !_.isFunction(fn)) {
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
  
      if (_.isString(data)) {
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

      if (toString.call(data) !== '[object Object]' || _.keys(data).length < 1) {
	fn({
	  message: 'that doesn\'t look like a valid object',
	  code: 400
	});
	return;
      }
  
      if (_.isUndefined(data.key)) {
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
      
      if (!_.isUndefined(data.changed) && _.isBoolean(data.changed) && data.changed) {
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
  
      if (!_.isUndefined(data.deleted) && _.isBoolean(data.deleted) && data.deleted) {
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

      fn({
	message: 'seems like you did an invalid request',
	code: 400
      });
      return;
    });
    
    socket.on('subscribe', function() {
      var args = Array.prototype.slice.call(arguments);
      
      var key = args.shift()
        , fn = args.pop() || function() {};
      
      if (!isKey(key)) {
	fn({
	  message: 'that doesn\'t look like a valid key',
	  code: 400
	});
	return;
      }
      
      if (key === 'master') {
	subscribe(['~user', user].join('+'), function(message, unsubscribe) {
	  if (!socket.disconnected) {
	    socket.emit('message', message);
	    return;
	  }
	  unsubscribe();
	});
	fn(null);
	return;
      }
      
      User.owns(
	user, key, function(err, owned) {
	  if (err) {
	    fn(err);
	    return;
	  }
	  
	  if (!owned) {
	    fn({
	      message: 'sorry, not authorized',
	      code: 401
	    });
	    return;
	  }
	  
	  subscribe(key, function(message, unsubscribe) {
	    if (!socket.disconnected) {
	      socket.emit('message', message);
	      return;
	    }
	    unsubscribe();
	  });
	  fn(null);
	}
      );
    });
    
    socket.on('publish', function() {
      var args = Array.prototype.slice.call(arguments);
      
      var packet = args.shift()
        , fn = args.pop() || function() {};

      if (!isPacket(packet) || !_.isFunction(fn)) {
	fn({
	  message: 'invalid packet or callback passed',
	  code: 400
	});
	return;
      }
      
      keys = packet.things;
      payload = packet.payload;
  
      if (!_.every(keys, isKey)) {
	fn({
	  message: 'some keys seem to be invalid',
	  code: 400
	});
	return;
      }
      
      var master = false;
      if (keys.indexOf('master') > -1) {
	keys = _.without(keys, 'master');
	master = true;
      }
      
      User.owns(
	user, keys, function(err, owned) {
	  if (err) {
	    fn(err);
	    return;
	  }

	  if (!owned) {
	    fn({
	      message: 'sorry, not authorized',
	      code: 401
	    });
	    return;
	  }

	  if (master) {
	    keys.push(['~user', user].join('+')); 
	  }
	  publish(keys, payload, fn);
	}
      );
      
    });
  });

  function subscribe(topic, fn) {
    var unsubscribe = function() {
      ascoltatore.unsubscribe(topic, fn);
    };
    
    ascoltatore.subscribe(topic, function(topic, packet) {
      fn(packet, unsubscribe);
    });
  }
  
  function publish(topics, payload, fn) {
    if (_.isString(keys)) {
      topics = [topics];
    }
    
    topics.forEach(function(topic) {
      ascoltatore.publish(
	topic, payload, {}, function() {
	  fn(null);
	}
      );
    });
  }
});

