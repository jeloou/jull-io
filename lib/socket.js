module.exports = (function(io) {
  io.on('connection', function(err, socket, session) {
    if (!session.passport.user) {
      return;
    }
    console.log('> user: ', session);
  });
});