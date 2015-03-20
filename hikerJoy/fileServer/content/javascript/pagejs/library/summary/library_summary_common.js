var loadingTags = genereateLoadingDiv('正在加载活动标签 ^^ ...');
$('#summary_tagsArea').append(loadingTags);

$('#summary_getmore').hide();
var orgContextInfo = null;

corsAjax({
    url: getDataServerRequestUrl('activity', 'getAllActivityTags'),
    success: function (data) {
        loadingTags.remove();
        if (validateNonEmptyArray(data)) {
            hikerJoy_context.getOrgContext()
            .then(function (orgs) {
                orgContextInfo = orgs;
                renderTags(data);
            });
        }
    }
});

var renderTags = function (tags) {
    var container = $('#summary_tagsArea').empty();
    tags.forEach(function (tag) {
        var span = $('<span />').addClass('activityTag pointerCursor').text(tag).data('tag', tag).bind('click', activityTagClick);
        container.append(span);
    });
};

$('#summary_tagSearch').bind('keyup', function () {
    searchTags($(this).val().trim());
});

var searchTags = function (query) {
    $('#summary_tagsArea .activityTag').each(function () {
        var tag = $(this), val = tag.data('tag');
        if ((typeof val) === 'string' && val.indexOf(query) >= 0)
            tag.show();
        else
            tag.hide();
    });
};

var activityTagClick = function () {
    var tag = $(this);
    if (!tag.hasClass('activityTagSelected')) {
        $('#summary_tagsArea .activityTag').removeClass('activityTagSelected');
        tag.addClass('activityTagSelected');
        renderTagRelatedFeedbacks(tag.data('tag'));
    }
};

var renderTagRelatedFeedbacks = function (tag) {
    if(tag) {
        $('#summary_summaryArea .feedbackOfTag').hide();
        var div = $('#summary_summaryArea .feedbackOfTag_' + tag);
        if(div.length > 0)
            div.show();
        else {
            div = $('<div />').addClass('feedbackOfTag feedbackOfTag_' + tag);
            getActIdListByTagFromServer(tag)
            .then(function (actIdlist) {
                actIdlist = validateNonEmptyArray(actIdlist) ? actIdlist : [];
                div.data('nonrenderActIdList', actIdlist);
                if(actIdlist.length > 0) {
                    var getMoreDiv = $('<div />').addClass('btn pointerCursor hoverBgGreen padding10px dashedRadius5pxBorder').css('text-align', 'center')
                                    .text('更多总结').bind('click', getMoreBtnClick).css('width', '100%').css('margin-top', '30px');
                    div.append(getMoreDiv);
                    getMoreDiv.trigger('click');
                }
            });
            $('#summary_summaryArea').append(div);
        }
    }
};

var getActIdListByTagFromServer = function (tag) {
    var defer = new Q.defer();
    if(tag) {
        corsAjax({
            url: getDataServerRequestUrl('library', 'getSharedActivityIdListByTag'),
            data: { 'tag': tag },
            success: function (data) {
                defer.resolve(data);
            }
        });
    }
    else
        defer.resolve([]);
    return defer.promise;
};

var getActivityFeedbacksFromServer = function (actIdlist) {
    var defer = new Q.defer();
    if(validateNonEmptyArray(actIdlist)) {
        corsAjax({
            url: getDataServerRequestUrl('activity', 'getActivityFeedback'),
            data: { 'actIdlist': actIdlist },
            success: function (data) {
                var ret = [];
                if(data && validateNonEmptyArray(data.activityWithFeedbacks)) {
                    data.activityWithFeedbacks.forEach(function (v) {
                        if(validateNonEmptyArray(v.organizer) && validateNonEmptyArray(data.organizer)) {
                            var organizers = [];
                            v.organizer.forEach(function (u) {
                                var matchedOrganizer = data.organizer.filter(function (o) { return o._id == u; });
                                if(matchedOrganizer.length > 0) organizers.push(matchedOrganizer[0]);
                            });
                            v.organizer = organizers;
                        }
                        else
                            v.organizer = [];
                        ret.push(v);
                    });
                }
                defer.resolve(ret);
            }
        });
    }
    else
        defer.resolve([]);
    return defer.promise;
};

var getMoreBtnClick = function () {
    var btn = $(this);
    var area = $(this).parents('.feedbackOfTag');
    var actIdlist = area.data('nonrenderActIdList');
    getActivityFeedbacksFromServer(actIdlist.splice(0, 2))
    .then(function (feedbacks) {
        if(validateNonEmptyArray(feedbacks))
            feedbacks.forEach(function (v) {
                btn.before(renderFeedback(v));
            });
    });
    if(actIdlist.length === 0)
        btn.fadeOut();
};

var renderFeedback = function (feedback) {
    var feedbackArea = $('<div />').css('margin-bottom', '15px');
    var head = $('<div />').css('text-align', 'center').addClass('feedback_head')
                .append($('<span />').text(feedback.name).css('font-size', '18px').css('font-weight', 'bold').addClass('pointerCursor').bind('click', hideFeedback));
    if(feedback.summary && !feedback.summaryUpdatedOn) head.append($('<span />').text('总结暂未上传').addClass('marginLR5px').css('font-size', '12px').css('font-weight', 'bold').css('color', '#888'));
    if(feedback.billstatement && !feedback.billstatementUpdatedOn) head.append($('<span />').text('账目暂未上传').addClass('marginLR5px').css('font-size', '12px').css('font-weight', 'bold').css('color', '#888'));
    var orgNameSpan = $('<span />').css('font-size', '12px').css('font-weight', 'bold').text('--- ' + searchOrgById(orgContextInfo, feedback.orgId).fullName);
    var subtitle = $('<div />').css('text-align', 'right').append(orgNameSpan).addClass('feedback_subtitle');

    if (feedback.summary) {
        //renderActFeedbackSummary_display comes from hikerJoy_lib_feedback.js
        var summary = $('<div />').attr('id', 'feedback_summary_' + feedback._id).addClass('tab-pane active').append(renderActFeedbackSummary_display(feedback));
    }
    if (feedback.billstatement) {
        //renderActFeedbackBillStatement_display comes from hikerJoy_lib_feedback.js
        var billstatement = $('<div />').attr('id', 'feedback_billstatement_' + feedback._id).addClass('tab-pane').append(renderActFeedbackBillStatement_display(feedback.billstatement));
    }

    var feedbackDisplayArea = $('<div />').addClass('feedback_displayArea');
    if (summary && billstatement) {
        var ul = $('<ul />').addClass('nav nav-tabs');
        ul.append($('<li />').addClass('active').append($('<a/>').attr('href', '#feedback_summary_' + feedback._id).attr('data-toggle', 'tab').text('活动总结')))
            .append($('<li />').append($('<a/>').attr('href', '#feedback_billstatement_' + feedback._id).attr('data-toggle', 'tab').text('活动账单')));
        var content = $('<div />').addClass('tab-content');
        content.append(summary).append(billstatement);
        feedbackDisplayArea.append(ul).append(content);
    }
    else {
        if (summary) {
            feedbackDisplayArea.append($('<div />').css('text-align', 'center').append($('<span />').text('活动总结').css('font-size', '15px').css('font-weight', 'bold')));
            feedbackDisplayArea.append(summary);
        }
        else {
            feedbackDisplayArea.append($('<div />').css('text-align', 'center').append($('<span />').text('活动账单').css('font-size', '15px').css('font-weight', 'bold')));
            feedbackDisplayArea.append(billstatement);
        }
    }

    return feedbackArea.append(head).append(subtitle).append(feedbackDisplayArea);
};

var hideFeedback = function () {
    $(this).parents('.feedback_head').siblings('.feedback_displayArea, .feedback_subtitle').slideToggle();
};