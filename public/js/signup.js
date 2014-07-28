$(function() {
  $('form.form-signup').submit(function(e) {
    e.preventDefault();
    
    var fields, data = {};
    fields = $(e.target).serializeArray();
    $.each(fields, function(k, field) {
      if (field.name != 'options') {
	data[field.name] = field.value;
      }
    });
    data['gender'] = $('#gender > .active > input').val();
    
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