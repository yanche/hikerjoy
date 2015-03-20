
var renderActivityBillstatement_editable = function (oneact) {
    var container = $('<div />').attr('id', 'leadership_billstatement_' + oneact._id).addClass('leadership_billstatement');
    var btnaddLine = $('<button />').addClass('btn btn-primary').text('添加条目').bind('click', addNewBillStatementLine);
    var btnsubmit = $('<button />').addClass('btn btn-success marginL15px').text('提交账单').bind('click', submitBillstatement);
    var table = renderActFeedbackBillStatement_display(oneact.billstatement, true);
    table.find('.fa-times').bind('click', removeBillstatementLine);
    return container.append(btnaddLine).append(btnsubmit).append(table);
};

var addNewBillStatementLine = function () {
    var newline = generateActFeedbackNewBillStatementLine_display('', '', '', true);
    newline.find('.fa-times').bind('click', removeBillstatementLine);
    $(this).parents('.leadership_billstatement').find('tbody').append(newline);
};

var removeBillstatementLine = function () { $(this).parents('tr').remove(); };

var submitBillstatement = function () {
    var scope = $(this).parents('.leadership_billstatement').find('tbody');
    if (validateAll(scope) && validateActBillStatementLines(scope)) {
        var billstatement = [];
        scope.find('tr').each(function () {
            var input = $(this).find('input');
            billstatement.push({ 'label': input.eq(0).val(), 'cost': input.eq(1).val(), 'comments': input.eq(2).val() });
        });
        corsAjax({
            url: getDataServerRequestUrl('activity', 'saveActBillStatement'),
            data: { 'actId': $(this).parents('.leadership_activity').data('actId'), 'billstatement': billstatement },
            success: function (data) {
                if (data) {
                    doAlert({ 'title': data.returnCode == 0 ? '提交活动账单成功' : '提交活动账单失败', 'msg': data.msg, 'style': data.returnCode == 0 ? 'success' : 'warning' });
                }
            }
        });
    }
};

var validateActBillStatementLines = function (scope) {
    var valid = true, labels = [];
    scope.find('tr').each(function () {
        var label = $(this).find('input:eq(0)');
        var labelVal = label.val().trim();
        if (labelVal.length === 0 || labels.contains(labelVal)) {
            valid = false;
            setError(label.parent('div'));
        }
        else {
            labels.push(labelVal);
        }
    });
    return valid;
};