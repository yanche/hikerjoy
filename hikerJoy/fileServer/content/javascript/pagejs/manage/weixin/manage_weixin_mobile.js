$(function () {
    $('#manage_nav_weixin_mobile').addClass('mobile_nav_active');

    WeixinApi.ready(function (api) {
        api.hideOptionMenu();
    });
});