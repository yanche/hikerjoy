$(function () {
    $('#admin_nav_orgs_mobile').addClass('mobile_nav_active');

    WeixinApi.ready(function (api) {
        api.hideOptionMenu();
    });
});