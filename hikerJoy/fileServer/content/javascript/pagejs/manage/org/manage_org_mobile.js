$(function () {
    $('#manage_nav_org_mobile').addClass('mobile_nav_active');

    WeixinApi.ready(function(api){
        api.hideOptionMenu();
    });
});