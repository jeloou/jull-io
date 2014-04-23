var js = {};

$(function() {
  var socket;
  
  console.log('> ready to go');
  socket = io.connect('/');
  js.socket = socket;
  
});