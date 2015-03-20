$(function () {
    WeixinApi.ready(function (api) {
        if (actId) {
            var wxCallbacks = {
                async: true,
                ready: function () {
                    var self = this;
                    corsAjax({
                        url: getDataServerRequestUrl('activity', 'getActWeixinShareInfo'),
                        data: { 'actId': actId },
                        success: function (data) {
                            var wxData = {
                                'appId': '',
                                'imgUrl': window.location.origin + data.picUrl,
                                'link': window.location.href,
                                'desc': '速速报名！' + data.intro,
                                'title': data.name
                            };
                            self.dataLoaded(wxData);
                        }
                    });
                }
            };

            api.showOptionMenu();
            api.shareToFriend({}, wxCallbacks);
            api.shareToTimeline({}, wxCallbacks);
        }
        else
            api.hideOptionMenu();
    });
    
    $('#home_nav_signup_mobile').addClass('mobile_nav_active');
});
