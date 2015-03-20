$(function () {
    $('#home_nav_routeplans').addClass('active');
});

var renderActs = function (acts) {
    var inner = $('<div />').addClass('carousel-inner');
    acts.forEach(function (act, k) {
        if (act)
            inner.append(renderOneAct(act));
    });
    var container = $('#orgActs_view').empty().addClass('carousel slide').data('ride', 'carousel');
    inner.appendTo(container);
    if (acts.length > 1) {
        $('<a class="left carousel-control" href="#orgActs_view" data-slide="prev" style="width:10%;"><span style="position:absolute;top:45%;left:45%;" class="fa fa-angle-left"></span></a>').appendTo(container);
        $('<a class="right carousel-control" href="#orgActs_view" data-slide="next" style="width:10%;"><span style="position:absolute;top:45%;right:45%;" class="fa fa-angle-right"></span></a>').appendTo(container);
    }
    container.find('.item:eq(0)').addClass('active');
    container.carousel();
};

var renderOneAct = function (act) {
    var container = $('<div />').addClass('item');
    var img = $('<img />').addClass('fullWidth').attr('src', act.picUrl);
    var shortWords = $('<div />').addClass('carouselWords');
    var swp1 = $('<p/>').addClass('h4').append($('<strong />').text('活动：' + act.name));
    var swp2 = $('<p/>').addClass('visible-md visible-lg h4');
    var stgp2 = $('<strong />').text('时间：' + (new Date(act.startsOn)).format('yyyy/MM/dd') + ' --- ' + (new Date(act.endsOn)).format('yyyy/MM/dd'));
    var swp3 = $('<p/>').addClass('visible-md visible-lg h4');
    var stgp3 = $('<strong />').text('简介：' + act.intro);
    var swp4 = $('<p/>').addClass('visible-md visible-lg h4');
    var stgp4 = $('<strong />').text('已报名：' + act.membersCount)
    var swp5 = $('<p/>').addClass('h4');
    var stgp5 = $('<strong />');
    var detailUrl = $('<span />').addClass('marginLR10px').append($('<i />').addClass('fa fa-file-image-o marginR5px')).append($('<a />').attr('href', getActRecruitmentUrl(currentOrgAlias, act._id)).addClass('clickable').css('color', 'white').css('display', 'inline').text('详细信息'));
    var signUpUrl = $('<span />').addClass('marginLR10px').append($('<i />').addClass('fa fa-lightbulb-o marginR5px')).append($('<a />').attr('href', getActSignupUrl(currentOrgAlias, act._id)).addClass('clickable').css('color', 'white').css('display', 'inline').text('前去报名！'));
    var forumUrl = $('<span />').addClass('marginLR10px').append($('<i />').addClass('fa fa-paper-plane marginR5px')).append($('<a />').attr('href', getForumIndexLink(currentOrgAlias, act._id)).addClass('clickable').css('color', 'white').css('display', 'inline').text('讨论区'));
    swp5.append(stgp5.append(detailUrl).append(signUpUrl).append(forumUrl));
    swp4.append(stgp4);
    swp3.append(stgp3);
    swp2.append(stgp2);
    shortWords.append(swp1).append(swp2).append(swp3).append(swp4).append(swp5);
    container.append(img).append(shortWords);
    return container;
};
