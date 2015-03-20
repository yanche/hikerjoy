
var renderActivityMembers = function (oneact) {
    var container = $('<div />').attr('id', 'leadership_members_' + oneact._id).addClass('members_view').data('activity', oneact);
    var basic = renderMemberBasicView(oneact.members, oneact.operate).addClass('col-xs-12 members_basicView paddingLR0px');
    return container.append(basic);
};

var renderMemberBasicView = function (members, operate) {
    var container = $('<div />');
    var table = $('<table />').addClass('table table-striped table-hover table-condensed members_basicView_table').css('text-align', 'center');
    table.append(renderBasicViewTableHeader());
    table.append(renderBasicViewTableBody(members, operate));
    container.append(table);
    var btnReportDiv = $('<div />').addClass('col-xs-4 paddingLR0px').append($('<button />').addClass('btn btn-xs btn-primary members_detailView_btnDownloadMembersReport').bind('click', downloadMembersReport).append($('<i />').addClass('fa fa-cloud-download marginR5px')).append($('<span />').text('队员名单')));
    var btnFetionDiv = $('<div />').addClass('col-xs-4 paddingLR0px').append($('<button />').addClass('btn btn-xs btn-warning members_detailView_btnDownloadFetionCSV').bind('click', downloadFetionCSV).append($('<i />').addClass('fa fa-cloud-download marginR5px')).append($('<span />').text('飞信CSV')));
    var btnMsgDiv = $('<div />').addClass('col-xs-4 paddingLR0px').append($('<button />').addClass('btn btn-xs btn-success members_detailView_btnMessageSender').bind('click', sendMessageModalTrigger).append($('<i />').addClass('fa fa-send marginR5px')).append($('<span />').text('发送邮件')));
    if (!operate) btnMsgDiv.find('.members_detailView_btnMessageSender').attr('disabled', '');
    return container.append(btnReportDiv).append(btnFetionDiv).append(btnMsgDiv);
};

var renderBasicViewTableHeader = function () {
    var thead = $('<thead />');
    var theadRow = $('<tr />');
    theadRow.append($('<th />').css('width', '25%').append($('<input />').addClass('form-control members_basicView_filter').attr('type', 'text').attr('placeholder', '姓名').css('font-weight', 'bold').data('filterKey', 'displayname').data('filterType', 'contains').bind('keyup', mobileMembersFilter)));
    var statusFilter = $('<span />').addClass('members_basicView_filter pointerCursor').css('font-weight', 'bold').data('filterKey', 'statusId').data('filterType', 'equals').data('value', '*').bind('filterUpdate', mobileMembersFilter).bind('click', updateFilter);
    statusFilter.data('options', [{ 'val': '*', 'desc': '所有' }, { 'val': '410', 'desc': '等待' }, { 'val': '420', 'desc': '入队' }, { 'val': '430', 'desc': '强制退出' }, { 'val': '440', 'desc': '退出' }]);
    statusFilter.append($('<span />').text('所有')).append($('<i >').addClass('fa fa-filter').css('margin-left', '3px'));
    var genderFilter = $('<span />').addClass('members_basicView_filter pointerCursor').css('font-weight', 'bold').data('filterKey', 'gender').data('filterType', 'equals').data('value', '*').bind('filterUpdate', mobileMembersFilter).bind('click', updateFilter);
    genderFilter.data('options', [{ 'val': '*', 'desc': '所有' }, { 'val': '男', 'desc': '男' }, { 'val': '女', 'desc': '女' }]);
    genderFilter.append($('<span />').text('所有')).append($('<i >').addClass('fa fa-filter').css('margin-left', '3px'));
    theadRow.append($('<th />').css('vertical-align', 'middle').css('width', '25%').append(statusFilter));
    theadRow.append($('<th />').css('vertical-align', 'middle').css('width', '25%').append(genderFilter));
    theadRow.append($('<th />').css('vertical-align', 'middle').append($('<span />').text('报名日期 ').addClass('members_basicView_signupOnSorter')));
    theadRow.append($('<th />').css('vertical-align', 'middle').append($('<input />').attr('type', 'checkbox').addClass('members_basicView_selectAll').bind('click', selectAllMemberChange)));
    theadRow.appendTo(thead);
    return thead;
}

var renderBasicViewTableBody = function (members, operate) {
    var tbody = $('<tbody />');
    var inTeam = members.filter(function (v, k) { return v.statusId == 420 }).sort(sortBySignup);
    var queued = members.filter(function (v, k) { return v.statusId == 410 }).sort(sortBySignup);
    var quit = members.filter(function (v, k) { return v.statusId == 440 }).sort(sortBySignup);
    var kickout = members.filter(function (v, k) { return v.statusId == 430 }).sort(sortBySignup);
    inTeam.forEach(function (v, k) {
        tbody.append(renderBasicViewTableBodyRow(v, operate));
    });
    queued.forEach(function (v, k) {
        tbody.append(renderBasicViewTableBodyRow(v, operate));
    });
    quit.forEach(function (v, k) {
        tbody.append(renderBasicViewTableBodyRow(v, operate));
    });
    kickout.forEach(function (v, k) {
        tbody.append(renderBasicViewTableBodyRow(v, operate));
    });
    return tbody;
};

var renderBasicViewTableBodyRow = function (onemem, operate) {
    var tr = $('<tr />').addClass('pointerCursor members_memberLine').bind('click', selectOneMember);
    var displayname = onemem.personalInfo.name || onemem.nickName || '';
    tr.data('statusId', onemem.statusId);
    tr.data('displayname', displayname);
    tr.data('email', onemem.personalInfo.email);
    tr.data('gender', onemem.personalInfo.gender);
    tr.data('memberId', onemem.memberId);
    tr.data('memberItems', onemem.items);
    tr.data('memberPersonalInfo', onemem.personalInfo);
    tr.data('memberNickName', onemem.nickName || '');
    tr.append($('<td />').text(displayname));
    var statusId = onemem.statusId;
    if (operate && (statusId == 410 || statusId == 420 || statusId == 430)) {
        var statusSelect = $('<span />').text(memberStatusMapping[statusId]);
        tr.append($('<td />').append($('<span />').addClass('members_status_update').bind('click', updateMemberStatus).append(statusSelect).append($('<i/>').addClass('fa fa-edit').css('margin-left', '3px'))));
    }
    else {
        tr.append($('<td />').text(memberStatusMapping[statusId]));
    }
    tr.append($('<td />').text(onemem.personalInfo.gender));
    tr.append($('<td />').text(new Date(onemem.signUpOn).format('yyyy/MM/dd')));
    tr.append($('<td />').append($('<input />').attr('type', 'checkbox').addClass('members_basicView_selectMember').bind('click', noPropagation)));
    return tr;
};

var mobileMembersFilter = function () {
    filter($(this).parents('table.members_basicView_table'));
};

var updateFilter = function () {
    var popup = $('#md_members_popup');
    popup.find('.modal-title').text('筛选队员');
    var body = popup.find('.modal-body').empty();
    var obj = $(this);
    obj.data('options').forEach(function (v, k) {
        body.append($('<div />').text(v.desc).attr('value', v.val).attr('desc', v.desc).addClass('h4 pointerCursor btn btn-default').css('width', '100%').css('margin-bottom', '15px'))
    });
    var currentValue = obj.data('value');
    popup.find('.modal-body div[value="' + currentValue + '"]').removeClass('btn-default').addClass('btn-success');
    popup.find('.modal-body div[value]').bind('click', function () {
        popup.modal('hide');
        var value = $(this).attr('value');
        if (currentValue != value) {
            obj.data('value', value).trigger('filterUpdate').children('span').text($(this).attr('desc'));
        }
    });
    popup.modal('show');
};

var updateMemberStatus = function (e) {
    e.stopPropagation();
    var popup = $('#md_members_popup');
    popup.find('.modal-title').text('更新队员状态');
    popup.find('.modal-body').empty()
    .append($('<div />').text('等待').attr('statusId', '410').addClass('h4 pointerCursor btn btn-default').css('width', '100%').css('margin-bottom', '15px'))
    .append($('<div />').text('入队').attr('statusId', '420').addClass('h4 pointerCursor btn btn-default').css('width', '100%').css('margin-bottom', '15px'))
    .append($('<div />').text('强制退出').attr('statusId', '430').addClass('h4 pointerCursor btn btn-default').css('width', '100%').css('margin-bottom', '15px'));
    var obj = $(this);
    var row = obj.parents('tr.members_memberLine');
    var currentStatusId = row.data('statusId');
    popup.find('.modal-body div[statusId="' + currentStatusId + '"]').removeClass('btn-default').addClass('btn-success');
    popup.find('.modal-body div[statusId]').bind('click', function () {
        popup.modal('hide');
        var statusId = $(this).attr('statusId');
        if (currentStatusId != statusId) {
            corsAjax({
                url: getDataServerRequestUrl('user', 'updateMemberStatus'),
                data: { 'userActId': row.data('memberId'), 'statusId': statusId },
                success: function (data) {
                    if (data) {
                        if (data.returnCode === 0) {
                            row.data('statusId', statusId);
                            obj.children('span').text(memberStatusMapping[statusId]);
                        }
                        else {
                            doAlert({ 'title': '更新队员状态失败', 'msg': data.msg, 'style': 'warning' });
                        }
                    }
                }
            });
        }
    });
    popup.modal('show');
};

var selectOneMember = function (e) {
    var obj = $(this);
    var memberItems = obj.data('memberItems');
    var memberInfo = obj.data('memberPersonalInfo');
    var memberNickName = obj.data('memberNickName');
    var memberStatus = memberStatusMapping[obj.data('statusId')];
    var detailView = $('#md_members_popup');
    var sheet = obj.parents('div.members_view').data('activity').sheet;
    var infoView = buildDetailPersonalInfoList(memberInfo, memberNickName, memberStatus);
    var itemView = buildDetailItemList(memberItems, sheet);
    detailView.find('.modal-body').empty().append(infoView).append($('<hr />')).append(itemView);
    detailView.modal('show');
};

var buildDetailPersonalInfoList = function (info, nickName, status) {
    var form = $('<form />').addClass('row');
    var divStatus = $('<div />').addClass('col-xs-6 marginB15px');
    divStatus.append($('<input />').val(status));
    var divNickName = $('<div />').addClass('col-xs-6 marginB15px');
    divNickName.append($('<input />').val(nickName || '').attr('placeholder', '昵称'));
    var divName = $('<div />').addClass('col-xs-6 marginB15px');
    divName.append($('<input />').val((info.name || '匿名') + ', ' + info.gender));
    var divPhone = $('<div />').addClass('col-xs-6 marginB15px');
    divPhone.append($('<input />').val(info.phone || '').attr('placeholder', '手机'));
    var divEmail = $('<div />').addClass('col-xs-12 marginB15px');
    divEmail.append($('<input />').val(info.email));
    form.append(divStatus).append(divNickName).append(divName).append(divPhone).append(divEmail);
    form.find('input').addClass('form-control disabledDefaultCursor').attr('disabled', '');
    return form;
};

var buildDetailItemList = function (items, sheet) {
    var form = $('<form />');
    if (validateNonEmptyArray(sheet)) {
        sheet.forEach(function (line) {
            form.append(buildDetailItemListLine(items, line));
        });
    }
    return form;
};

var buildDetailItemListLine = function (items, line) {
    var ret = $('<div />').addClass('form-group');
    var label = $('<label />').text(line.label);
    var data = mappingData2SheetLine(items, line);
    data = data.length > 0 ? data[0] : false;
    if (line.type === 'image')
        var val = $('<img />').addClass('img-responsive').attr('src', data ? data.value : '/content/image/noimageUpload_default.jpg');
    else if (line.type === 'multi-select')
        var val = $('<input />').addClass('form-control disabledDefaultCursor').val(data ? data.value.join(', ') : '').attr('disabled', '');
    else if (line.type === 'textarea')
        var val = $('<textarea />').addClass('form-control disabledDefaultCursor').css('height', '80px').val(data ? data.value : '').attr('disabled', '');
    else
        var val = $('<input />').addClass('form-control disabledDefaultCursor').val(data ? data.value : '').attr('disabled', '');
    return ret.append(label).append(val);
};
