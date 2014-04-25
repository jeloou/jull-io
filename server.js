"use strict" 

var express = require('express')
  , passport = require('passport')
  , config = require('./config')
  , http = require('http')
  , app = express()
  , server
  , routes
  , io;

server = http.createServer(app);
io = require('socket.io').listen(server);
config(app, io, passport);

routes = [
  './app/web/routes',
  './app/users/routes',
  './app/devices/routes',
];

routes.forEach(function(path) {
  require(path).apply(app, passport);
});

server.listen(3000, function(err) {
  if (err) {
    console.error('Unable to listen for connections', err);
    process.exit(10);
  }
  console.info('App running');
});