var renderActFeedbackSummary_display = function (feedback, editable) {
    var form = $('<form />').addClass('form-horizontal').css('margin-top', '15px');
    var actName = $('<div />').addClass('form-group');
    actName.append($('<label />').addClass('col-sm-2 control-label').text('活动'));
    actName.append($('<div />').addClass('col-sm-9').append($('<input />').val(feedback.name).attr('type', 'text').addClass('form-control actPropertySummaryLine')));
    var actStartsOn = $('<div />').addClass('form-group');
    actStartsOn.append($('<label />').addClass('col-sm-2 control-label').text('开始时间'));
    actStartsOn.append($('<div />').addClass('col-sm-9').append($('<input />').val((new Date(feedback.startsOn)).format('yyyy/MM/dd')).attr('type', 'text').addClass('form-control actPropertySummaryLine')));
    var actEndsOn = $('<div />').addClass('form-group');
    actEndsOn.append($('<label />').addClass('col-sm-2 control-label').text('结束时间'));
    actEndsOn.append($('<div />').addClass('col-sm-9').append($('<input />').val((new Date(feedback.endsOn)).format('yyyy/MM/dd')).attr('type', 'text').addClass('form-control actPropertySummaryLine')));
    var actOrganizer = $('<div />').addClass('form-group');
    actOrganizer.append($('<label />').addClass('col-sm-2 control-label').text('组织者'));
    var organizerStr = '';
    if(validateNonEmptyArray(feedback.organizer))
        organizerStr = feedback.organizer.map(function (u) { return u.name + '(' + u.email + ')'; }).join(', ');
    actOrganizer.append($('<div />').addClass('col-sm-9').append($('<input />').val(organizerStr).attr('type', 'text').addClass('form-control actPropertySummaryLine')));
    var actTags = $('<div />').addClass('form-group');
    actTags.append($('<label />').addClass('col-sm-2 control-label').text('标签'));
    var tagStr = '';
    if(Array.isArray(feedback.tags))
        tagStr = feedback.tags.join(', ');
    actTags.append($('<div />').addClass('col-sm-9').append($('<input />').val(tagStr).attr('type', 'text').addClass('form-control actPropertySummaryLine')));
    var contactContainer = $('<div />').addClass('col-sm-9');
    var contactLabel = $('<label />').addClass('col-sm-2 control-label');
    if(editable) contactLabel.append($('<a />').addClass('btn btn-default').text('联系方式').bind('click', addSummaryContactLine).data('contactArea', contactContainer));
    else contactLabel.text('联系方式');
    if (feedback.summary && validateNonEmptyArray(feedback.summary.contact)) {
        var contactTable = generateSummaryContactTable(editable).data('contactArea', contactContainer);
        var body = $('<tbody />');
        feedback.summary.contact.forEach(function (v) {
            body.append(generateSummaryContactLine(editable, v.name, v.role, v.contact));
        });
        contactTable.append(body).appendTo(contactContainer);
    }
    else
        generateSummaryNoContactHint(editable).appendTo(contactContainer);
    var contact = $('<div />').addClass('form-group').append(contactLabel).append(contactContainer);
    var detailsLabel = $('<label />').addClass('col-sm-2 control-label').text('细节详述');
    var detailsContent = $('<div />').addClass('col-sm-9 htmlPostView');
    if(editable) {
        var detailEditor = $('<div />').addClass('summernote').appendTo(detailsContent).summernote(generalSummernoteOption());
        if (feedback.summary && Array.isArray(feedback.summary.details))
            detailEditor.code(htmlPostArrayToHtml(feedback.summary.details));
    }
    else {
        if (feedback.summary && Array.isArray(feedback.summary.details))
            detailsContent.html(htmlPostArrayToHtml(feedback.summary.details));
    }
    var details = $('<div />').addClass('form-group').append(detailsLabel).append(detailsContent);
    form.append(actName).append(actStartsOn).append(actEndsOn).append(actOrganizer).append(actTags).append(contact).append(details);
    form.find(editable ? '.actPropertySummaryLine' : 'input, textarea').attr('disabled', '').addClass('disabledDefaultCursor');
    return form;
};

var generateSummaryContactTable = function (editable) {
    var contactTable = $('<table />').addClass('table table-striped table-hover feedbackSummaryContactTable').css('text-align', 'center');
    var headRow = $('<tr />');
    if(editable) headRow.append($('<th />'));
    headRow.append($('<th />').text('姓名')).append($('<th />').text('角色')).append($('<th />').text('联系方式'));
    return contactTable.append($('<thead />').append(headRow));
};

var generateSummaryContactLine = function (editable, name, role, contact) {
    var row = $('<tr />').addClass('summaryContactLine');
    if (editable) row.append($('<td />').append($('<i />').addClass('fa fa-times hoverRed pointerCursor').bind('click', removeSummaryContactLine)));
    return row.append($('<td />').append($('<div />').append($('<input />').addClass('form-control').val(name || '').bind('focusout', function () {validateSummaryContacts($(this).parents('.feedbackSummaryContactTable'));}))))
            .append($('<td />').append($('<input />').addClass('form-control').val(role || '')))
            .append($('<td />').append($('<input />').addClass('form-control').val(contact || '')));
};

var generateSummaryNoContactHint = function (editable) {
    return $('<text />').addClass('fontBold').addClass(editable ? 'paddingT15px' : 'paddingT7px').text(editable ? '暂无联系人，请为活动总结填写联系人' : '未填写活动相关联系人').css('display', 'inline-block');
};

var addSummaryContactLine = function (e) {
    e.preventDefault();
    var obj = $(this);
    var target = obj.data('contactArea');
    var tbody = target.find('.feedbackSummaryContactTable tbody');
    if (tbody.length > 0)
        tbody.append(generateSummaryContactLine(true));
    else {
        var contactTable = generateSummaryContactTable(true).data('contactArea', target);
        $('<tbody />').append(generateSummaryContactLine(true)).appendTo(contactTable);
        target.empty().append(contactTable);
    }
};

var removeSummaryContactLine = function (e) {
    var obj = $(this);
    if(obj.parents('tr').siblings('tr').length === 0)
        obj.parents('table.feedbackSummaryContactTable').data('contactArea').empty().append(generateSummaryNoContactHint(true));
    else
        obj.parents('tr').remove();
};

var retrieveSummaryContact = function (scope) {
    var ret = [];
    if(scope) {
        var names = [];
        scope.find('tr.summaryContactLine').each(function () {
            var inputs = $(this).find('input');
            var name = inputs.eq(0).val().trim();
            if(name.length > 0 && !names.contains(name)) {
                ret.push({ 'name': name, 'role': inputs.eq(1).val().trim(), 'contact': inputs.eq(2).val().trim() });
                names.push(name);
            }
        });
    }
    return ret;
};

var validateSummaryContacts = function (scope) {
    var valid = true;
    if(scope) {
        var names = [];
        scope.find('tr.summaryContactLine').each(function () {
            var input = $(this).find('input:eq(0)');
            rmvError(input.parent('div'));
            var name = input.val().trim();
            if(name.length > 0) {
                if(names.contains(name)) {
                    setError(input.parent('div'));
                    valid = false;
                }
                else
                    names.push(name);
            }
        });
    }
    return valid;
};

var renderActFeedbackBillStatement_display = function (billstatement, editable) {
    var table = $('<table />').addClass('table table-striped table-hover').css('text-align', 'center');
    var thead = $('<thead />').append($('<tr />').append(editable ? $('<th />') : null).append($('<th />').text('细目')).append($('<th />').text('开销')).append($('<th />').text('备注')));
    var tbody = $('<tbody />');
    if(Array.isArray(billstatement) && billstatement.length > 0) {
        billstatement.forEach(function (v, k) {
            if(v) { tbody.append(generateActFeedbackNewBillStatementLine_display(v.label, v.cost, v.comments, editable)); }
        });
    }
    return table.append(thead).append(tbody);
};

var generateActFeedbackNewBillStatementLine_display = function (label, cost, comments, editable) {
    if(editable) {
        var remover = $('<td />').append($('<i />').addClass('fa fa-times hoverRed pointerCursor'));
        var label = $('<td />').append($('<div />').append($('<input />').addClass('form-control').val(label).attr('validate', 'valuedString')));
        var cost = $('<td />').append($('<div />').append($('<input />').addClass('form-control').val(cost).attr('validate', 'pos_float')));
        var comments = $('<td />').append($('<input />').addClass('form-control').val(comments));
        return $('<tr />').append(remover).append(label).append(cost).append(comments);
    }
    else {
        var label = $('<td />').text(label);
        var cost = $('<td />').text(cost);
        var comments = $('<td />').text(comments);
        return $('<tr />').append(label).append(cost).append(comments);
    }
};
