$(function() {
  $('form.form-signup').submit(function(e) {
    e.preventDefault();
    
    var fields, data = {};
    fields = $(e.target).serializeArray();
    $.each(fields, function(k, field) {
      data[(field.name == 'options')? 'gender' : field.name] = field.value;
    });
    
    $.ajax({
      type: 'POST',
      url: '/users/',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(data),
      success: function(user) {
	location.href = '/';
      },
      error: function(res) {
	alert(res.responseText);
      }
    });
  });
});