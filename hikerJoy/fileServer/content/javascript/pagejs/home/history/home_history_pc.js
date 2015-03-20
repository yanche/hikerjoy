$(function () {
    $('#home_nav_history').addClass('active');
});

var renderOneActivity = function (oneact) {
    var container = $('<div />').addClass('col-xs-12 col-lg-6 marginB15px');
    var divPic = $('<div />').append($('<a />').attr('href', getActRecruitmentUrl(currentOrgAlias, oneact._id)).append($('<img />').attr('src', oneact.picUrl)));
    var introHead = $('<div />').text(oneact.name).css('color', 'orange').addClass('fontBold');
    var introBody = $('<div />').text((oneact.intro || '').slice(0, 60) + '...').css('font-size', '12px').data('intro', oneact.intro || '');
    var divIntro = $('<div />').append(introHead).append(introBody);
    var divLink = $('<div />');
    divLink.append($('<a />').attr('href', getActRecruitmentUrl(currentOrgAlias, oneact._id)).append($('<i />').addClass('fa fa-file-image-o marginR5px')).append($('<span />').text('详细信息')).addClass('overflowEllipsis clickable').css('display', 'block'));
    divLink.append($('<a />').attr('href', getForumIndexLink(currentOrgAlias, oneact._id)).append($('<i />').addClass('fa fa-paper-plane marginR5px')).append($('<span />').text('讨论区')).addClass('overflowEllipsis clickable').css('display', 'block'));
    divLink.append($('<span />').text((new Date(oneact.startsOn)).format('yyyy/MM/dd')).css('font-size', '12px'));
    container.append(divPic.addClass('col-xs-4 paddingLR2px')).append(divIntro.addClass('col-xs-6 paddingLR2px')).append(divLink.addClass('col-xs-2 paddingLR2px'));
    container.find('img').css('max-width', '100%');
    return container;
};

