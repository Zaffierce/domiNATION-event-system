'use strict';

$(() => {
  
  // var forms = document.getElementsByClassName('needs-validation');

  // var validation = Array.prototype.filter.call(forms, function(form) {
  //   form.addEventListener('submit', function(event) {
  //     if (form.checkValidity() === false) {
  //       event.preventDefault();
  //       event.stopPropagation();
  //     }
  //     form.classList.add("was-validated");
  //   }, false);
  // });

  // $(function () {
  //   $('[data-toggle="popover"]').popover()
  // });
  
  // $('.popover-dismiss').popover({
  //   trigger: 'focus'
  // });

  $('.signup-submit-btn').on('click', function(event) {
    event.preventDefault();
    const userName = $('#eventSignUpModal-username').val();
    const userID = $('#eventSignUpModal-userid').val();
    const eventID = $('#eventSignUpModal-eventid').val();
    let modal = $(this).parent().parent();
    if (!userName) return alert("Please enter your username.");
    else {
      modal.find('#signup').attr("hidden", "hidden");
      modal.find('#signedup').removeAttr("hidden");
      $('.signup-submit-btn').attr("hidden", "hidden");
      modal.find('.modal-title').text("Successfully Signed Up!")
      $.ajax({
        url: '/signup',
        method: 'POST',
        data: { 
          user : userName,
          userID : userID,
          eventID: eventID
        },
        dataType: "json",
        success:  function(data) {
          $(`.${eventID}`).find('.signup-btn').attr("hidden", "hidden");
          $(`.${eventID}`).find('.cancel-btn-hidden').removeAttr("hidden");
        },
        error: function(error) {
          console.log(`Error! ${error}`);
        }
      });
    }
  });

  $('.unsignup-submit-btn').on('click', function(event) {
    event.preventDefault();
    const userName = $('#eventSignUpModal-username').val();
    const userID = $('#eventSignUpModal-userid').val();
    const eventID = $('#eventSignUpModal-eventid').val();
    let modal = $(this).parent().parent();
    modal.find('.unsignup-submit-btn').attr("hidden", "hidden");
    modal.find('.modal-title').text("Successfully Removed!");
    modal.find('#cancel').attr("hidden", "hidden");
    modal.find('#cancel-confirmed').removeAttr("hidden");
    $.ajax({
      url: '/unsignup',
      method: 'POST',
      data: { 
        user : userName,
        userID : userID,
        eventID: eventID
      },
      dataType: "json",
      success:  function(data) {
        $(`.${eventID}`).find('.signup-btn-hidden').removeAttr("hidden");
        $(`.${eventID}`).find('.cancel-btn').attr("hidden", "hidden");
      },
      error: function(error) {
        console.log(`Error! ${error}`);
      }
    });
  });

  $(".modal").on("hidden.bs.modal", function(event) {
    event.preventDefault();
    //When a user dismisses a modal, this essentially "resets" the modal.
    $('#signup').removeAttr("hidden");
    $('#signedup').attr("hidden", "hidden");
    $('.signup-submit-btn').removeAttr("hidden");
  });

  $('.info').on('click', function(event) {
    event.preventDefault();
    $('#eventSignUpModal-eventid').val($(this).data("eventid"));
    $('#eventSignUpModal-userid').val($(this).data("userid"));
  });

  // $('.edit-server').on('click', function() {
  //   $('#editServerModal-server_id').val($(this).data("serverid"));
  //   $('#editServerModal-id').val($(this).data("id"));
  //   $('#editServerModal-server_name').val($(this).data("servername"));
  //   $('#editServerModal-remove_server_id').val($(this).data("serverid"));
  // });

});