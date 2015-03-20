$(function () {
    $('#global_nav_leadership_mobile, #home_nav_leadership_mobile').addClass('mobile_nav_active');
});

//buildPopupModal
var body = $('<div />').addClass('modal-body');
var head = $('<div />').addClass('modal-header').append($('<button />').html('&times;').addClass('close').attr('data-dismiss', 'modal')).append($('<h5 />').addClass('modal-title'));
var dialog = $('<div />').addClass('modal-dialog').append($('<div />').addClass('modal-content').append(head).append(body));
var modal = $('<div />').addClass('modal fade').attr('id', 'md_members_popup').attr('role', 'dialog').attr('aria-hidden', 'true').append(dialog);
$('body').append(modal);
