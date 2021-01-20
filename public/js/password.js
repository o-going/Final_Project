$(function() {
  $("#sign-up-form").submit(function(event) {
    $('#password').val(CryptoJS.SHA256($('#password').val()).toString());
  }),
  
  $("#login-form").submit(function(event) {
    $('#password').val(CryptoJS.SHA256($('#password').val()).toString());
  })
});