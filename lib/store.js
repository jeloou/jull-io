var kue = require('kue');

module.exports = (function(settings) {
  var jobs;
  
  jobs = kue.createQueue(settings);
  jobs.process('store', function(job, fn) {
    fn();
  });
});