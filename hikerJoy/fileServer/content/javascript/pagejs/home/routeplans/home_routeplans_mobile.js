$(function () {
    $('#home_nav_routeplans_mobile').addClass('mobile_nav_active');

    WeixinApi.ready(function (api) {
        var wxCallbacks = {
            async: true,
            ready: function () {
                var self = this;
                corsAjax({
                    url: getDataServerRequestUrl('org', 'getOrgWeixinShareInfo'),
                    data: { 'org': currentOrgAlias },
                    success: function (data) {
                        var wxData = {
                            'appId': '',
                            'imgUrl': window.location.origin + data.logoUrl,
                            'link': window.location.href,
                            'desc': data.fullName + ' --- 点击查看 活动线路',
                            'title': '活动线路'
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

var renderActs = function (acts) {
    if (validateNonEmptyArray(acts)) {
        if (acts.length === 1)
            var content = renderOnlyOneAct(acts[0]);
        else
            var content = renderMultipleActs(acts);
        $('#orgActs_view').empty().append(content);
    }
};

var renderMultipleActs = function (acts) {
    var container = $('<div />');
    acts.forEach(function (act, k) {
        container.append(renderOneAct(act));
    });
    return container;
};

var renderOneAct = function (act) {
    var text = $('<div />').addClass('mobile_2act_intro_text').text(act.name);
    var img = $('<img />').addClass('mobile_2act_intro_image').attr('src', act.picUrl);
    var ret = $('<a />').addClass('mobile_2act_intro_container anchorNoneDeco').append(text).append(img).attr('href', getActRecruitmentUrl(currentOrgAlias, act._id));
    return ret;
};

var renderOnlyOneAct = function (act) {
    var container = $('<a />').addClass('mobile_1act_intro_container').attr('href', getActRecruitmentUrl(currentOrgAlias, act._id));
    var img = $('<img />').addClass('fullWidth').attr('src', act.picUrl);
    var name = $('<div />').css('position', 'absolute').addClass('mobile_1act_intro_textContainer').append($('<text />').addClass('mobile_1act_intro_text').text(act.name));
    container.append(img).append(name);
    return container;
};
