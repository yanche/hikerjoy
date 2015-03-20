$(function () {
    $('#home_nav_history_mobile').addClass('mobile_nav_active');
});

var renderOneActivity = function (oneact) {
    var container = $('<div />').addClass('col-xs-12 marginB15px paddingLR0px paddingB15px').css('border-bottom', '1px solid #eee');
    var divHead = $('<div />').addClass('fontBold').text(oneact.name + ' ' + (new Date(oneact.startsOn)).format('yyyy/MM/dd')).css('color', 'orange');
    var divPic = $('<div />').append($('<a />').attr('href', getActRecruitmentUrl(currentOrgAlias, oneact._id)).append($('<img />').attr('src', oneact.picUrl)));
    var divIntro = $('<div />').text((oneact.intro || '').slice(0, 60) + '...').css('font-size', '12px').data('intro', oneact.intro || '');
    var divLink = $('<div />');
    divLink.append($('<a />').addClass('marginR5px').attr('href', getActRecruitmentUrl(currentOrgAlias, oneact._id)).append($('<i />').addClass('fa fa-file-image-o marginR5px')).append($('<span />').text('详细信息')).addClass('clickable'));
    divLink.append($('<a />').addClass('marginR5px marginL15px').attr('href', getForumIndexLink(currentOrgAlias, oneact._id)).append($('<i />').addClass('fa fa-paper-plane marginR5px')).append($('<span />').text('讨论区')).addClass('clickable'));
    container.append(divHead.addClass('col-xs-12')).append(divPic.addClass('col-xs-6 paddingR2px')).append(divIntro.addClass('col-xs-6 paddingL2px')).append(divLink.addClass('col-xs-12'));
    container.find('img').css('max-width', '100%');
    return container;
};
