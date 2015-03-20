var buildPage = function (data) {
    var container = $('#feedback_main');
    var list = $('<div />').addClass('col-xs-3');
    var content = $('<div />').addClass('col-xs-9').attr('id', 'feedback_content');
    //getActsInYear from manage_feedback_common.js
    buildList(list, getActsInYear(data));
    container.append(list).append(content);
    buildToolTip();
};

//data: [ {'year':, 'acts': [array of activity] } ]
var buildList = function (container, data) {
    if (data.length > 1) {
        var yrList = $('<ul />');
        data.forEach(function (v) {
            var yrActs = $('<ul />');
            v.acts.forEach(function (act) {
                var actLine = $('<li />').text(act.name).addClass('feedback_listLineItem feedback_tooltip').data('actId', act._id).bind('click', chooseActToSeeFeedback);
                yrActs.append(actLine);
            });
            yrList.append($('<li />').append($('<span />').text(v.year).addClass('feedback_list').bind('click', function () { $(this).siblings('ul').slideToggle(); })).append(yrActs));
        });
        container.append(yrList);
    }
    else {
        var yrActs = $('<ul />');
        data[0].acts.forEach(function (act) {
            var actLine = $('<li />').text(act.name).addClass('feedback_listLineItem feedback_tooltip').data('actId', act._id).bind('click', chooseActToSeeFeedback);
            yrActs.append(actLine);
        });
        container.append(yrActs);
    }
}

var buildToolTip = function () {
    $('.feedback_tooltip').each(function () {
        var obj = $(this);
        if (obj[0].scrollWidth > obj.width()) { //text overflow
            obj.tooltip({ 'title': obj.text() });
        }
    })
};

var currentActId = null;

var chooseActToSeeFeedback = function () {
    var obj = $(this);
    var actId = obj.data('actId');
    if (currentActId === null || currentActId !== actId) {
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
    var head = $('<div />').css('text-align', 'center').append($('<span />').text(feedback.name).css('font-size', '18px').css('font-weight', 'bold'));
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
