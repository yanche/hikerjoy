
var sendMessageModalTrigger = function () {
    var selectedRow = $(this).parents('.members_view').find('.members_basicView_selectMember:checked').parents('tr.members_memberLine');
    if (selectedRow.length === 0)
        doAlert({ 'title': '没有选中的队员', 'msg': '请选择需要发送信息的队员', 'style': 'warning' });
    else {
        var selectedUser = [];
        selectedRow.each(function () {
            var obj = $(this);
            var memberId = obj.data('memberId');
            var displayname = obj.data('displayname');
            var nickName = obj.data('memberNickName');
            var email = obj.data('email');
            selectedUser.push({ 'memberId': memberId, 'displayname': displayname, 'nickName': nickName, 'email': email });
        });
        renderMembers2SendMessageModal(selectedUser);
        $('#leadership_md_sendMessage_send').data('actId', $(this).parents('div.members_view').data('actId'));
        $('#leadership_md_sendMessage').modal('show');
    }
};

var renderMembers2SendMessageModal = function (users) {
    if (validateNonEmptyArray(users)) {
        var container = $('#leadership_md_sendMessage_receivers').empty();
        users.forEach(function (v, k) {
            var span = $('<span />').addClass('sendMessageCandidate').text((v.displayname || v.email) + ' ').data('memberId', v.memberId).data('stage', '1').bind('refreshState', refreshMessageReceiverState).bind('click', determinMessageReceiver);
            span.append($('<i />').addClass('fa'));
            container.append(span);
            span.trigger('refreshState');
        });
        $('#leadership_md_sendMessage_subject, #leadership_md_sendMessage_body').val('');
    }
};

var refreshMessageReceiverState = function () {
    var obj = $(this);
    if (obj.data('stage') == '1')
        obj.css('background-color', '#5cb85c').find('i').removeClass('fa-times').addClass('fa-check');
    else
        obj.css('background-color', 'white').find('i').removeClass('fa-check').addClass('fa-times');
};

var determinMessageReceiver = function () {
    var obj = $(this);
    if (obj.data('stage') == '1')
        obj.data('stage', '0');
    else
        obj.data('stage', '1');
    obj.trigger('refreshState');
};

$(function () {
    $('#leadership_md_sendMessage_send').bind('click', function () {
        if (validateAll($('#leadership_md_sendMessage'))) {
            var memberIds = [];
            $('#leadership_md_sendMessage_receivers .sendMessageCandidate').each(function () {
                var obj = $(this);
                if (obj.data('stage') == '1' && !memberIds.contains(obj.data('memberId')))
                    memberIds.push(obj.data('memberId'));
            });
            if (memberIds.length === 0)
                doAlert({ 'title': '没有选中的队员', 'msg': '请选择需要发送信息的队员', 'style': 'warning' });
            else {
                var subject = $('#leadership_md_sendMessage_subject').val().trim();
                var body = $('#leadership_md_sendMessage_body').val().trim();
                var btn = $(this).attr('disabled', '');
                corsAjax({
                    url: getDataServerRequestUrl('activity', 'sendEmailToActMembers'),
                    data: { 'memberIds': memberIds, 'subject': subject, 'body': body, 'ccOrganizer': true },
                    success: function (ret) {
                        if (ret) {
                            btn.removeAttr('disabled');
                            doAlert({ 'title': ret.returnCode === 0 ? '发送邮件成功' : '发送邮件失败', 'msg': ret.msg, 'style': ret.returnCode === 0 ? 'success' : 'warning' });
                            if (ret.returnCode === 0) $('#leadership_md_sendMessage').modal('hide');
                        }
                    }
                });
            }
        }
    });
});

var downloadMembersReport = function () {
    var scope = $(this).parents('div.members_view');
    var activity = scope.data('activity')
    var sheet = activity.sheet;
    var report = [];
    report.push(generateReportHead(sheet).join(','));
    var rows = scope.find('tbody tr.members_memberLine');
    report = report.concat(generateReportBody(rows, sheet));
    var blob = new Blob(['\ufeff' + report.join('\n')], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, activity.name + '.csv');
};

var generateReportHead = function (sheet) {
    var heads = ['状态', '昵称', '姓名', '性别', '电话', '邮箱'];
    if (validateNonEmptyArray(sheet)) {
        sheet.forEach(function (line) {
            //sheetLineTypeForDownloading from hikerJoy_lib.js
            if (sheetLineTypeForDownloading.contains(line.type)) {
                if (line.type === 'multi-select' && validateNonEmptyArray(line.children)) {
                    line.children.forEach(function (ch, k) {
                        heads.push(line.label + '-' + ch);
                    });
                }
                else
                    heads.push(line.label);
            }
        });
    }
    heads = heads.map(function (v, k) {
        return '"' + v + '"';
    });
    return heads;
};

//input: rows, jquery object
var generateReportBody = function (rows, sheet) {
    var ret = [];
    rows.each(function () {
        var row = $(this);
        ret.push(generateReportBodyRow(row, sheet));
    });
    return ret;
};

var generateReportBodyRow = function (row, sheet) {
    var personalInfo = row.data('memberPersonalInfo');
    var nickName = row.data('memberNickName');
    var values = [memberStatusMapping[row.data('statusId')], nickName || '', personalInfo.name || '', personalInfo.gender, personalInfo.phone || '', personalInfo.email];
    if (validateNonEmptyArray(sheet)) {
        var items = row.data('memberItems');
        sheet.forEach(function (line) {
            var item = mappingData2SheetLine(items, line);
            item = Array.isArray(item) && item.length === 1 ? item[0] : false;
            if (sheetLineTypeForDownloading.contains(line.type)) {
                if (line.type === 'multi-select' && Array.isArray(line.children) && line.children.length > 0) {
                    line.children.forEach(function (ch, k) {
                        if (!item)
                            values.push('');
                        else if (Array.isArray(item.value) && item.value.contains(ch))
                            values.push('1');
                        else
                            values.push('0');
                    });
                }
                else
                    values.push(item ? item.value : '');
            }
        });
    }
    values = values.map(function (v, k) {
        var num = Number(v);
        if (isNaN(num) || v === '')
            return '"' + v + '"';
        else
            return '"\'' + v + '\'"';
    });
    return values.join(',');
};

var downloadFetionCSV = function () {
    var scope = $(this).parents('div.members_view');
    var activity = scope.data('activity')
    var report = ['MobileNo'];
    var unreport = [];
    scope.find('tbody tr.members_memberLine').each(function () {
        var row = $(this);
        var personalInfo = row.data('memberPersonalInfo');
        var displayname = row.data('displayname');
        if(personalInfo.phone)
            report.push(personalInfo.phone);
        else
            unreport.push(displayname || personalInfo.email);
    });
    var blob = new Blob([report.join('\n')], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, activity.name + '_队员飞信名单' + '.csv');
    if(unreport.length > 0)
        doAlert({ 'title': '部分队员未成功导出', 'msg': '抱歉，由于部分队员没有填写手机号，故无法导出飞信联系人，请尝试发送邮件联系！以下为名单：' + unreport.join(', '), 'style': 'warning' });
};

var mappingData2SheetLine = function (data, line) {
    return data.filter(function (v) { return v.label.trim() === line.label.trim() && v.type.trim() === line.type.trim(); });
};

var memberStatusMapping = {
    '410': '等待',
    '420': '入队',
    '430': '强制退出',
    '440': '退出',
};

var sortBySignup = function (mem1, mem2) {
    return sortByDateAsc(mem1, mem2, 'signUpOn');
};

var filter = function (scope) {
    var ft = getFilterKeys(scope);
    scope.find('tbody tr.members_memberLine').each(function () {
        var row = $(this);
        var match = ft.every(function (v, k) {
            var target = row.data(v.key);
            if (v.type === 'equals')
                return v.by === '*' || v.by == target;
            else if (v.type === 'contains')
                return target.indexOf(v.by) >= 0;
            else
                return true;
        });
        if (match)
        {
           row.removeClass('hidden');
        }
        else
        {  
              row.addClass('hidden');
              row.next().addClass('hidden');
        }
    });
};

var getFilterKeys = function (scope) {
    var ret = [];
    scope.find('.members_basicView_filter').each(function () {
        var obj = $(this);
        if(!obj.is('span') &&  obj.val()!='*' && obj.val()!='') 
        {//alert(obj.data('value'));
            obj.css('border','ridge');
            obj.css('border-color','blue');
        }
        else
        {
            obj.css('border','');
            obj.css('border-color','');
        }

        ret.push({ 'by': obj.is('span') ? obj.data('value') : obj.val().trim(), 'key': obj.data('filterKey'), 'type': obj.data('filterType') });
    });
    return ret;
};

var selectAllMemberChange = function () {
    var obj = $(this);
    var targets = obj.parents('table.members_basicView_table').find('tbody tr:not(.hidden) .members_basicView_selectMember');
    if (obj.is(':checked'))
        targets.prop('checked', true);
    else
        targets.prop('checked', false);
};

var noPropagation = function (e) {
    e.stopPropagation();
};
