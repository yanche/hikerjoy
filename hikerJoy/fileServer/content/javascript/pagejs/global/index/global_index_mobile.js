$(function () {
    $('#global_nav_index_mobile').addClass('mobile_nav_active');
    
    WeixinApi.ready(function (api) {
        var wxData = {
            'appId': '',
            'imgUrl': window.location.origin + '/content/image/icon.jpg',
            'link': window.location.href,
            'desc': 'hikerJoy! 户外爱好者与社团聚集地',
            'title': 'hikerJoy'
        };
        
        api.showOptionMenu();
        api.shareToFriend(wxData);
        api.shareToTimeline(wxData);
    });
});
