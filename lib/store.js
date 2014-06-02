var db = require('mongoose')
  , kue = require('kue');

module.exports = (function(settings) {
  var jobs;
  
  jobs = kue.createQueue(settings);
  jobs.process('store', function(job, fn) {
    var Segmment = db.model('Segmment'), data;
    
    data = job.data;
    Segmment.last(data, function(err, segmment) {
      if (err) {
	fn(err);
	return;
      }
      
      if (!segmment) {
	Segmment.add(data, function(err) {
	  if (err) {
	    fn(err);
	    return;
	  }
	  
	  fn();
	});
	return;
      }
      
      data.segmment = segmment;
      Segmment.modify(data, function(err) {
	if (err) {
	  fn(err);
	  return;
	}
	
	fn();
      });
    });
  });
});