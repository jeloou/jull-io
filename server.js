"use strict" 

var express = require('express')
  , passport = require('passport')
  , config = require('./config')
  , app = express()
  , routes;

config(app, passport);

routes = [
  './app/users/routes',
];

routes.forEach(function(path) {
  require(path)(app, passport);
});

app.listen(3000, '127.0.0.1', function(err) {
  if (err) {
      console.error('Unable to listen for connections', err);
      process.exit(10);
  }
  console.info('App running');
});