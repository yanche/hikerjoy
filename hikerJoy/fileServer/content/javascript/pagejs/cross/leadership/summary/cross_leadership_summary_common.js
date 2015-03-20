
var renderActivitySummary_editable = function (oneact) {
    var container = $('<div />').attr('id', 'leadership_summary_' + oneact._id).addClass('leadership_summary');
    var btnsubmit = $('<button />').addClass('btn btn-success marginL15px').text('提交总结').bind('click', submitSummary);
    var form = renderActFeedbackSummary_display(oneact, true).addClass('leadership_summary_lines');
    return container.append(btnsubmit).append(form);
};

var submitSummary = function () {
    var btn = $(this);
    var scope = btn.parents('.leadership_summary').find('.leadership_summary_lines');
    if (validateSummaryContacts(scope)) {
        btn.attr('disabled', '');
        var contact = retrieveSummaryContact(scope);
        var details = $('<div />').html(scope.find('.summernote').code()).toHtmlPostModel();
        corsAjax({
            url: getDataServerRequestUrl('activity', 'saveActSummary'),
            data: { 'actId': $(this).parents('.leadership_activity').data('actId'), 'summary': { 'contact': contact, 'details': details } },
            success: function (data) {
                btn.removeAttr('disabled');
                if (data)
                    doAlert({ 'title': data.returnCode == 0 ? '提交活动总结成功' : '提交活动总结失败', 'msg': data.msg, 'style': data.returnCode == 0 ? 'success' : 'warning' });
            }
        });
    }
};