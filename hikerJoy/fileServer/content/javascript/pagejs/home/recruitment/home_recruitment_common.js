var actId = getQueryString().activity;

var renderRecruitmentPost = function (arr) {
    if(validateNonEmptyArray(arr))
        $('#recruitment_recruitmentPost').html(htmlPostArrayToHtml(arr));
    else
        sayNoRecruitment();
};

var sayNoRecruitment = function () {
    $('#recruitment_recruitmentPost').empty().append($('<strong />').text('抱歉，暂未发布线路召集帖').addClass('h4'));
};

var stored = hikerJoy_storage.getStoredRecruitment(actId);
if (stored && Array.isArray(stored.recruitment))
    renderRecruitmentPost(stored.recruitment);
else {
    var loadingRecruitment = genereateLoadingDiv();
    loadingRecruitment.appendTo($('#recruitment_recruitmentPost'));
}

corsAjax({
    url: getDataServerRequestUrl('activity', 'getActRecruitment'),
    data: { 'actId': actId, 'recruitmentUpdatedOn': stored ? stored.recruitmentUpdatedOn : null },
    success: function (data) {
        if(loadingRecruitment) loadingRecruitment.remove();
        if (data) {
            if(Array.isArray(data.recruitment)) {
                hikerJoy_storage.storeRecruitment(actId, data.recruitment, data.recruitmentUpdatedOn);
                renderRecruitmentPost(data.recruitment);
                console.log('from server');
            }
            else if (!stored)
                sayNoRecruitment();

            var helpPanel = $('#recruitment_helpPanel');
            if(data.statusId === 120) { //120: open
                var signupUrl = getActSignupUrl(getCurrentPageOrg(), actId);
                var goSignup = $('<span />').append($('<i />').addClass('fa fa-lightbulb-o')).append($('<a />').attr('href', signupUrl).text('前去报名！').addClass('clickable').css('margin-left', '3px'));
                helpPanel.append(goSignup.css('margin-right', '5px'));
            }
            //getForumIndexLink from hikerJoy_lib_forum.js
            var forumUrl = getForumIndexLink(getCurrentPageOrg(), actId);
            var goForum = $('<span />').append($('<i />').addClass('fa fa-paper-plane')).append($('<a />').attr('href', forumUrl).text('讨论区').addClass('clickable').css('margin-left', '3px'));
            helpPanel.append(goForum);
        }
        else
            sayNoRecruitment();
    }
});
