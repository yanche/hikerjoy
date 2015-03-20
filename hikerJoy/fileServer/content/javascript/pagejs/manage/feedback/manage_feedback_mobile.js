WeixinApi.ready(function (api) {
    api.hideOptionMenu();
});

$(function () {
    $('#manage_nav_feedback_mobile').addClass('mobile_nav_active');
});

var buildPage = function (data) {
    var container = $('#feedback_main');
    var list = $('<div />').attr('id', 'feedback_head').css('padding', '5px');
    var content = $('<div />').attr('id', 'feedback_content').css('margin-top', '15px').css('padding', '5px');
    buildList(list, getActsInYear(data));
    container.append(list).append(content);
};

//data: [ {'year':, 'acts': [array of activity] } ]
var buildList = function (container, data) {
    if (data.length > 1) {
        var yrList = $('<div />'), actList = $('<div />');
        data.forEach(function (v) {
            var yrActs = $('<div />').addClass('feedback_actInYear feedback_actInYear_' + v.year);
            v.acts.forEach(function (act) {
                var actLine = $('<div />').text(act.name).addClass('feedback_listLineItem').data('actId', act._id).bind('click', chooseActToSeeFeedback);
                yrActs.append(actLine);
            });
            yrList.append($('<button />').text(v.year).data('year', v.year).addClass('feedback_yearItem_mobile btn btn-default').bind('click', yearButtonClick));
            actList.append(yrActs);
        });
        container.append(yrList).append(actList);
        yrList.find('button:eq(0)').removeClass('btn-default').addClass('btn-success');
        actList.find('.feedback_actInYear').not(':eq(0)').hide();
    }
    else {
        data[0].acts.forEach(function (act) {
            var actLine = $('<div />').text(act.name).addClass('feedback_listLineItem').data('actId', act._id).bind('click', chooseActToSeeFeedback);
            container.append(actLine);
        });
    }
};

var yearButtonClick = function () {
    $('button.feedback_yearItem_mobile').removeClass('btn-success').addClass('btn-default');
    var year = $(this).removeClass('btn-default').addClass('btn-success').data('year');
    $('.feedback_actInYear').hide();
    $('.feedback_actInYear_' + year).show();
};

var currentActId = null;

var chooseActToSeeFeedback = function () {
    var obj = $(this);
    var actId = obj.data('actId');
    if (currentActId === null || currentActId !== actId) {
        $('#feedback_head').slideUp();
        //getFeedback from manage_feedback_common.js
        getFeedback(actId)
        .then(function (feedback) {
            if (feedback) {
                renderFeedbacks(feedback);
                currentActId = actId;
            }
        });
    }
};

var renderFeedbacks = function (feedback) {
    var container = $('#feedback_content').empty();
    var head = $('<div />').addClass('feedback_actnamehead pointerCursor').bind('click', function () { $('#feedback_head').slideToggle(); })
                .css('text-align', 'center').css('margin-bottom', '10px')
                .append($('<span />').addClass('fa fa-exchange').css('margin-right', '10px'))
                .append($('<span />').text(feedback.name).css('font-size', '18px').css('font-weight', 'bold'));
    var ul = $('<ul />').addClass('nav nav-tabs');
    ul.append($('<li />').addClass('active').append($('<a/>').attr('href', '#feedback_summary_' + feedback._id).attr('data-toggle', 'tab').text('活动总结')))
        .append($('<li />').append($('<a/>').attr('href', '#feedback_billstatement_' + feedback._id).attr('data-toggle', 'tab').text('活动账单')));
    var content = $('<div />').addClass('tab-content');
    //renderActFeedbackSummary_display comes from hikerJoy_lib_feedback.js
    var summary = $('<div />').attr('id', 'feedback_summary_' + feedback._id).addClass('tab-pane active').append(renderActFeedbackSummary_display(feedback));
    //renderActFeedbackBillStatement_display comes from hikerJoy_lib_feedback.js
    var billstatement = $('<div />').attr('id', 'feedback_billstatement_' + feedback._id).addClass('tab-pane').append(renderActFeedbackBillStatement_display(feedback.billstatement));
    content.append(summary).append(billstatement);
    container.append(head).append(ul).append(content);
};
