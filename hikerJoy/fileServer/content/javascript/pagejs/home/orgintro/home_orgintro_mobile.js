$(function () {
    WeixinApi.ready(function (api) {
        var wxCallbacks = {
            async: true,
            ready: function () {
                var self = this;
                corsAjax({
                    url: getDataServerRequestUrl('org', 'getOrgWeixinShareInfo'),
                    data: { 'org': getCurrentPageOrg() },
                    success: function (data) {
                        var wxData = {
                            'appId': '',
                            'imgUrl': window.location.origin + data.logoUrl,
                            'link': window.location.href,
                            'desc': data.shortIntro,
                            'title': data.fullName
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

    $('#home_nav_orgintro_mobile').addClass('mobile_nav_active');
});