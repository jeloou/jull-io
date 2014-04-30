var db = require('mongoose')
  , kue = require('kue');

module.exports = (function(settings) {
  var jobs;
  
  jobs = kue.createQueue(settings);
  jobs.process('store', function(job, fn) {
    var Segmment = db.model('Segmment');
    
    var data = job.data
      , args;
    
    args = {
      payload: data.payload,
      user: data.user
    };
    
    Segmment.lastUpdated(args, function(err, segmment) {
      if (err) {
	fn(err);
	return;
      }
      
      if (!segmment) {
	Segmment.add(payload, function(err) {
	  if (err) {
	    fn(err);
	    return;
	  }
	  
	  fn();
	});
	return;
      }
      
      args.id = segmment._id;
      Segmment.modify(args, function(err) {
	if (err) {
	  fn(err);
	  return;
	}
	
	fn();
      });
    });
  });
});