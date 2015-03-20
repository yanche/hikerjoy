var renderOneActiveRecord = function (oneact) {
    var view = renderOneRecord(oneact).addClass('activeFootprint');
    var linkArea = view.find('div').last();
    if(validateNonEmptyArray(oneact.sheet)) {
        var sheetform = renderSheet(oneact.sheet, oneact.items).addClass('marginT15px');
        var updateSheetBtn = $('<button />').addClass('btn btn-success').data('userActId', oneact.userActId).data('form', sheetform).bind('click', updateSheet).text('更新');
        linkArea.append($('<div />').text('修改报名信息').addClass('clickable overflowEllipsis activeSpecial').bind('click', function () { signupSheetArea.slideToggle(); }));
        var signupSheetArea = $('<div />').addClass('col-xs-12 activeSpecial').append(sheetform).append(updateSheetBtn).hide();
        view.append(signupSheetArea);
    }
    linkArea.append($('<div />').addClass('clickable overflowEllipsis activeSpecial').bind('click', userQuitActivity).text('退出活动').data('userActId', oneact.userActId));
    return view;
};

var renderOneHistoryRecord = function (oneact) {
    return renderOneRecord(oneact).addClass('historyFootprint').hide();
};

var renderOneRecord = function (oneact) {
    var org = ((currentOrgInfo_1 && currentOrgInfo_1._id == oneact.orgId) ? currentOrgInfo_1 : searchOrgById(currentOrgInfo_multi, oneact.orgId)) || {};
    var container = $('<div />').addClass('col-xs-12 marginB15px paddingB15px').css('border-bottom', '1px solid #eee');
    var divPic = $('<div />').append($('<a />').attr('href', getActRecruitmentUrl(org.alias, oneact.actId)).append($('<img />').attr('src', oneact.actPicUrl)));
    var introTitle = $('<div />').text(oneact.actName).css('color', 'orange').css('font-size', '18px').addClass('fontBold');
    var introSubTitle = $('<div />').addClass('fontBold').append($('<span />').text((new Date(oneact.startsOn)).format('yyyy/MM/dd') + ' - ' + (new Date(oneact.endsOn)).format('yyyy/MM/dd')));
    introSubTitle.append($('<span />').text('活动状态：' + activityStatusMapping[oneact.actStatusId]).addClass('marginL15px'));
    introSubTitle.append($('<span />').text('我的状态：' + memberStatusMapping[oneact.memberStatusId]).addClass('marginL15px'));
    var introBody = $('<div />').text(oneact.actIntro || '').css('font-size', '12px').data('intro', oneact.intro || '');
    var divIntro = $('<div />').append(introTitle).append(introSubTitle).append(introBody);
    var divLink = $('<div />');
    if(!currentOrgInfo_1)
        divLink.append($('<a />').attr('href', getOrgUrl(org.alias)).append($('<i />').addClass('fa fa-leaf marginR5px')).append($('<span />').text(org.shortName)).addClass('overflowEllipsis clickable').css('display', 'block'));
    divLink.append($('<a />').attr('href', getActRecruitmentUrl(org.alias, oneact.actId)).append($('<i />').addClass('fa fa-file-image-o marginR5px')).append($('<span />').text('详细信息')).addClass('overflowEllipsis clickable').css('display', 'block'));
    divLink.append($('<a />').attr('href', getForumIndexLink(org.alias, oneact.actId)).append($('<i />').addClass('fa fa-paper-plane marginR5px')).append($('<span />').text('讨论区')).addClass('overflowEllipsis clickable').css('display', 'block'));
    container.append(divPic.addClass('col-xs-4 paddingLR2px')).append(divIntro.addClass('col-xs-6 paddingLR2px')).append(divLink.addClass('col-xs-2 paddingLR2px'));
    container.find('img').css('max-width', '100%');
    return container;
};

var updateSheet = function () {
    var btn = $(this).attr('disabled', '');
    var form = btn.data('form');
    var userActId = btn.data('userActId');
    var signupData = collectSignupSheetData(form);
    corsAjax({
        url: getDataServerRequestUrl('user', 'updateUserSignupSheet'),
        data: { 'userActId': userActId, 'items': signupData },
        success: function (data) {
            btn.removeAttr('disabled');
            if (data) {
                doAlert({'title': data.returnCode == 0 ? '更新报名信息成功' : '更新报名信息失败', 'msg': data.msg, 'style': data.returnCode == 0 ? 'success' : 'warning'});
                if(data.returnCode === 0)
                    replaceImageSrcToSignupSheet(form, data.picUrls);
            }
        }
    });
};

var userQuitActivity = function () {
    var btn = $(this).attr('disabled', '');
    corsAjax({
        url: getDataServerRequestUrl('user', 'userActQuit'),
        data: { 'userActId': btn.data('userActId') },
        success: function (data) {
            btn.removeAttr('disabled');
            if (data) {
                if(data.returnCode == 0)
                    btn.parents('.activeFootprint').find('.activeSpecial').remove();
                doAlert({
                    'title': data.returnCode == 0 ? '活动退出成功' : '活动退出失败',
                    'msg': data.msg,
                    'style': data.returnCode == 0 ? 'success' : 'warning'
                });
            }
        }
    });
};
