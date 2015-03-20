$(function () {
    WeixinApi.ready(function (api) {
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
                            'desc': data.intro,
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
    });
});
