$(function () {
    $('#home_nav_footprint_mobile').addClass('mobile_nav_active');
    
    var body = $('<div />').addClass('modal-body');
    var head = $('<div />').addClass('modal-header').append($('<button />').html('&times;').addClass('close').attr('data-dismiss', 'modal')).append($('<h5 />').addClass('modal-title').text('更新报名信息'));
    var dialog = $('<div />').addClass('modal-dialog').append($('<div />').addClass('modal-content').append(head).append(body));
    var modal = $('<div />').addClass('modal fade').attr('id', 'md_footprint_popup').attr('role', 'dialog').attr('aria-hidden', 'true').append(dialog);
    $('body').append(modal);

    WeixinApi.ready(function(api){
        api.hideOptionMenu();
    });
});

var renderOneActiveRecord = function (oneact) {
    var view = renderOneRecord(oneact).addClass('activeFootprint');
    var linkArea = view.find('div').last();
    if(validateNonEmptyArray(oneact.sheet))
        linkArea.append($('<div />').text('修改报名信息').addClass('clickable overflowEllipsis activeSpecial').bind('click', showUpdateSignupSheetDialog).data('oneact', oneact));
    linkArea.append($('<div />').addClass('clickable overflowEllipsis activeSpecial').bind('click', userQuitActivity).text('退出活动').data('userActId', oneact.userActId));
    return view;
};

var renderOneHistoryRecord = function (oneact) {
    return renderOneRecord(oneact).addClass('historyFootprint').hide();
};

var renderOneRecord = function (oneact) {
    var org = ((currentOrgInfo_1 && currentOrgInfo_1._id == oneact.orgId) ? currentOrgInfo_1 : searchOrgById(currentOrgInfo_multi, oneact.orgId)) || {};
    var container = $('<div />').addClass('col-xs-12 marginB15px paddingLR0px paddingB15px').css('border-bottom', '1px solid #eee');
    var divHead = $('<div />').addClass('fontBold').text(oneact.actName).css('color', 'orange');
    var divPic = $('<div />').append($('<img />').attr('src', oneact.actPicUrl));
    var divInfo = $('<div />').append($('<div />').addClass('overflowEllipsis').text((new Date(oneact.startsOn)).format('yyyy/MM/dd') + ' - ' + (new Date(oneact.endsOn)).format('yyyy/MM/dd')));
    divInfo.append($('<div />').addClass('overflowEllipsis').text('活动状态：' + activityStatusMapping[oneact.actStatusId]));
    divInfo.append($('<div />').addClass('overflowEllipsis').text('我的状态：' + memberStatusMapping[oneact.memberStatusId]));
    var divLink = $('<div />').append($('<a />').addClass('marginR5px').attr('href', getOrgUrl(org.alias)).append($('<i />').addClass('fa fa-leaf marginR5px')).append($('<span />').text(org.shortName)).addClass('clickable'));
    divLink.append($('<a />').addClass('marginR5px').attr('href', getActRecruitmentUrl(org.alias, oneact.actId)).append($('<i />').addClass('fa fa-file-image-o marginR5px')).append($('<span />').text('详细信息')).addClass('clickable'));
    divLink.append($('<a />').addClass('marginR5px').attr('href', getForumIndexLink(org.alias, oneact.actId)).append($('<i />').addClass('fa fa-paper-plane marginR5px')).append($('<span />').text('讨论区')).addClass('clickable'));
    container.append(divHead.addClass('col-xs-12')).append(divPic.addClass('col-xs-6 paddingR2px')).append(divInfo.addClass('col-xs-6 paddingL2px')).append(divLink.addClass('col-xs-12'));
    container.find('img').css('max-width', '100%');
    return container;
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

var showUpdateSignupSheetDialog = function () {
    var oneact = $(this).data('oneact');
    var sheetform = renderSheet(oneact.sheet, oneact.items).addClass('marginT15px');
    var updateSheetBtn = $('<button />').addClass('btn btn-success').data('oneact', oneact).data('form', sheetform).bind('click', updateSheet).text('更新');
    var popup = $('#md_footprint_popup');
    popup.find('.modal-body').empty().append(sheetform).append(updateSheetBtn);
    popup.modal('show');
};

var updateSheet = function () {
    var btn = $(this).attr('disabled', '');
    var form = btn.data('form');
    var oneact = btn.data('oneact');
    var userActId = oneact.userActId;
    var signupData = collectSignupSheetData(form);
    corsAjax({
        url: getDataServerRequestUrl('user', 'updateUserSignupSheet'),
        data: { 'userActId': userActId, 'items': signupData },
        success: function (data) {
            btn.removeAttr('disabled');
            if (data) {
                doAlert({'title': data.returnCode == 0 ? '更新报名信息成功' : '更新报名信息失败', 'msg': data.msg, 'style': data.returnCode == 0 ? 'success' : 'warning'});
                if(data.returnCode == 0) {
                    replaceImageSrcToSignupSheet(form, data.picUrls);
                    oneact.items = collectSignupSheetData(form);
                    $('#md_footprint_popup').modal('hide');
                }
            }
        }
    });
};

