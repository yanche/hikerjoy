$(function () {
    $('#global_nav_activities_mobile').addClass('mobile_nav_active');
});

var renderOneActivity = function (oneact) {
    var org = searchOrgById(orgInfoContext, oneact.orgId) || {};
    var container = $('<div />').addClass('col-xs-12 marginB15px paddingLR0px paddingB15px').css('border-bottom', '1px solid #eee');
    var divHead = $('<div />').addClass('fontBold').text(oneact.name + ' （已报名：' + oneact.membersCount + '）' + (new Date(oneact.startsOn)).format('yyyy/MM/dd')).css('color', 'orange');
    var divPic = $('<div />').append($('<a />').attr('href', getActRecruitmentUrl(org.alias, oneact._id)).append($('<img />').attr('src', oneact.picUrl)));
    var divIntro = $('<div />').text(sliceActivityIntro(oneact.intro)).css('font-size', '12px').data('intro', oneact.intro || '');
    var divLink = $('<div />').append($('<a />').addClass('marginR5px').attr('href', getOrgUrl(org.alias)).append($('<i />').addClass('fa fa-leaf marginR5px')).append($('<span />').text(org.shortName)).addClass('clickable'));
    divLink.append($('<a />').addClass('marginR5px').attr('href', getActRecruitmentUrl(org.alias, oneact._id)).append($('<i />').addClass('fa fa-file-image-o marginR5px')).append($('<span />').text('详细信息')).addClass('clickable'));
    divLink.append($('<a />').addClass('marginR5px').attr('href', getActSignupUrl(org.alias, oneact._id)).append($('<i />').addClass('fa fa-lightbulb-o marginR5px')).append($('<span />').text('前去报名')).addClass('clickable'));
    divLink.append($('<a />').addClass('marginR5px').attr('href', getForumIndexLink(org.alias, oneact._id)).append($('<i />').addClass('fa fa-paper-plane marginR5px')).append($('<span />').text('讨论区')).addClass('clickable'));
    container.append(divHead.addClass('col-xs-12')).append(divPic.addClass('col-xs-6 paddingR2px')).append(divIntro.addClass('col-xs-6 paddingL2px')).append(divLink.addClass('col-xs-12'));
    container.find('img').css('max-width', '100%');
    return container;
};
