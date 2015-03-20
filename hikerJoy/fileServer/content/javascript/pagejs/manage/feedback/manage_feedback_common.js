$('#feedback_shareArea_shrink').bind('click', function () {
    var btn = $(this);
    $('#feedback_shareArea').slideToggle(function () {
        if (btn.hasClass('fa-minus'))
            btn.removeClass('fa-minus').addClass('fa-plus');
        else
            btn.removeClass('fa-plus').addClass('fa-minus');
    });
});

var currentOrgAlias = getCurrentPageOrg();

var confirmShare = function () {
    var defer = new Q.defer();
    $('#feedback_shareConfirm_cancel').unbind('click').bind('click', function () {
        defer.resolve(false);
    });
    $('#feedback_shareConfirm_confirm').unbind('click').bind('click', function () {
        defer.resolve(true);
    });
    $('#md_shareConfirm').modal({ 'backdrop': 'static', 'keyboard': false });
    return defer.promise;
};

var feedbackCache = new _hikerJoy_cache();

var getFeedback = function (actId) {
    var defer = new Q.defer(), fromCache = feedbackCache.getValue(actId);
    if(fromCache)
        defer.resolve(fromCache);
    else {
        corsAjax({
            url: getDataServerRequestUrl('activity', 'getActivityFeedback'),
            data: { 'actIdlist': [actId] },
            success: function (data) {
                if (data && validateNonEmptyArray(data.activityWithFeedbacks)) {
                    var fdback = data.activityWithFeedbacks[0];
                    fdback.organizer = data.organizer;
                    feedbackCache.setValue(actId, fdback); //cache
                    defer.resolve(fdback);
                }
                else
                    defer.resolve(null);
            }
        });
    }
    return defer.promise;
};

var loadingStatus = genereateLoadingDiv('正在加载当前的分享状态 ^^ ...');
$('#feedback_shareStatus').append(loadingStatus);
var shareStatus = {};

corsAjax({
    url: getDataServerRequestUrl('org', 'getOrgShareStatus'),
    data: { 'orgAlias': currentOrgAlias },
    success: function (data) {
        loadingStatus.remove();
        shareStatus.shareSummary = Boolean(data && data.shareSummary);
        shareStatus.shareBillStatement = Boolean(data && data.shareBillStatement);
        setShareState();
    }
});

var loadingActsRecords = genereateLoadingDiv('正在加载社团的历史活动记录 ^^ ...');
$('#feedback_main').append(loadingActsRecords);

corsAjax({
    url: getDataServerRequestUrl('activity', 'getHistoricalActsRecords'),
    data: { 'orgAlias': getCurrentPageOrg() },
    success: function (data) {
        loadingActsRecords.remove();
        if (validateNonEmptyArray(data))
            buildPage(data);
    }
});

/*
var loadingSharingOrgs = genereateLoadingDiv('正在加载所有社团的分享信息 ^^ ...');
$('#feedback_sharingOrg').append(loadingSharingOrgs);
corsAjax({
    url: getDataServerRequestUrl('library', 'getSharingOrgs'),
    success: function (data) {
        loadingSharingOrgs.remove();
        var sharing = new hikerJoy_sharingData(data.orgs, data.activities);
        $('#feedback_sharingOrg').append($('<text />').text('现在有' + sharing.sharingSummaryOrgs + '个社团参与分享活动总结（一共拥有' + sharing.activitiesWithSummary + '份活动总结），有' + sharing.sharingBillOrgs + '个社团参与分享活动账单（一共拥有' + sharing.activitiesWithBill + '份活动账单）'));
    }
});
*/

var setShareState = function () {
    var container = $('#feedback_shareStatus').empty();
    var spanSummary = $('<span />').addClass('marginR15px');
    var spanBill = $('<span />').addClass('marginR15px');
    var btnSummary = $('<button />').addClass('btn').bind('click', changeShareStatus_summary);
    var btnBill = $('<button />').addClass('btn').bind('click', changeShareStatus_bill);
    if (shareStatus.shareSummary) {
        spanSummary.text('活动总结：分享');
        btnSummary.addClass('btn-danger').text('取消分享活动总结').data('state', '0');
    }
    else {
        spanSummary.text('活动总结：未分享');
        btnSummary.addClass('btn-success').text('分享活动总结').data('state', '1');
    }
    if (shareStatus.shareBillStatement) {
        spanBill.text('活动账目：分享');
        btnBill.addClass('btn-danger').text('取消分享活动账目').data('state', '0');
    }
    else {
        spanBill.text('活动账目：未分享');
        btnBill.addClass('btn-success').text('分享活动账目').data('state', '1');
    }
    var summaryStatus = $('<div />').addClass('padding5px').append(spanSummary).append(btnSummary);
    var billStatus = $('<div />').addClass('padding5px').append(spanBill).append(btnBill);
    container.append(summaryStatus).append(billStatus);
    if (!shareStatus.shareBillStatement && !shareStatus.shareSummary)
        $('#feedback_link_library').hide();
};

var getActsInYear = function (data) {
    var years = [];
    data.sort(function (v1, v2) { return sortByDateAsc(v1, v2, 'startsOn'); }).forEach(function (v) {
        var yr = (new Date(v.startsOn)).format('yyyy');
        var match = years.filter(function (u) { return u.year === yr; });
        if (match.length > 0) match[0].acts.push(v);
        else years.push({ 'year': yr, 'acts': [v] });
    });
    return years;
};

var changeShareStatus_summary = function () {
    var btn = $(this);
    confirmShare()
    .then(function (confirm) {
        if (confirm) {
            btn.attr('disabled', '');
            corsAjax({
                url: getDataServerRequestUrl('org', 'setShareSummary'),
                data: { 'orgAlias': currentOrgAlias, 'share': btn.data('state') },
                success: function (data) {
                    btn.removeAttr('disabled');
                    if (data.returnCode != 0 && data.returnCode != 1)
                        doAlert({ 'title': '改变活动总结分享状态失败', 'msg': data.msg, 'style': 'warning' });
                    else {
                        shareStatus.shareSummary = btn.data('state') === '1';
                        setShareState();
                    }
                }
            });
        }
    })
};

var changeShareStatus_bill = function () {
    var btn = $(this);
    confirmShare()
    .then(function (confirm) {
        if (confirm) {
            btn.attr('disabled', '');
            corsAjax({
                url: getDataServerRequestUrl('org', 'setShareBillStatement'),
                data: { 'orgAlias': currentOrgAlias, 'share': btn.data('state') },
                success: function (data) {
                    btn.removeAttr('disabled');
                    if (data.returnCode != 0 && data.returnCode != 1)
                        doAlert({ 'title': '改变活动账目分享状态失败', 'msg': data.msg, 'style': 'warning' });
                    else {
                        shareStatus.shareBillStatement = btn.data('state') === '1';
                        setShareState();
                    }
                }
            });
        }
    })
};
