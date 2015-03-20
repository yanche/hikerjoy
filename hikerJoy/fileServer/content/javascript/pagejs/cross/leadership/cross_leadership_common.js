
var currentOrgAlias = getCurrentPageOrg();

var loading = genereateLoadingDiv('正在加载你带队的活动 ^^ ...');
$('#leadership_activitySelection').append(loading);

corsAjax({
    url: getDataServerRequestUrl('activity', 'getAllActiveActs_MyLeadershipOrAdmin'),
    data: { 'orgAlias': currentOrgAlias },
    success: function (data) {
        loading.remove();
        renderLeadershipActivities(data);
    }
});

var renderLeadershipActivities = function (acts) {
    if (validateNonEmptyArray(acts)) {
        getLeadershipDataFromServer(acts)
        .then(function () {
            $(function () {
                if (acts.length === 1) {
                    //renderOneLeadershipActivity from cross_leadership_pc.js or cross_leadership_mobile.js
                    renderOneLeadershipActivity(acts[0])
                    $('#leadership_activitySelection').append($('<span />').text(acts[0].name).addClass('fontBold').css('font-size', '18px')).css('text-align', 'center');
                }
                else {
                    acts.forEach(function (oneact) { renderOneLeadershipActivity(oneact); });
                    var actselect = $('<select />').addClass('form-control');
                    actselect.appendTo($('#leadership_activitySelection'));
                    acts.forEach(function (oneact) { actselect.append($('<option />').attr('value', oneact._id).text(oneact.name)); });
                    actselect.bind('change', function () {
                        $('.leadership_activity').hide();
                        $('.leadership_activity_' + actselect.val()).show();
                    }).trigger('change');
                }
            });
        });
    }
    else $('#leadership_activitySelection').removeAttr('class').text('似乎当前没有你带的队伍呢').addClass('fontBold');
};

//feedback, members
var getLeadershipDataFromServer = function (acts) {
    var deferFeedback = new Q.defer(), deferMembers = new Q.defer();
    var actIdlist = acts.map(function (v) { return v._id; });
    corsAjax({
        url: getDataServerRequestUrl('activity', 'getActivityFeedback'),
        data: { 'actIdlist': actIdlist },
        success: function (data) {
            if (data && validateNonEmptyArray(data.activityWithFeedbacks)) {
                data.activityWithFeedbacks.forEach(function (v) {
                    if (validateNonEmptyArray(v.organizer) && validateNonEmptyArray(data.organizer)) {
                        var organizers = [];
                        v.organizer.forEach(function (u) {
                            var matchedOrganizer = data.organizer.filter(function (o) { return o._id == u; });
                            if (matchedOrganizer.length > 0) organizers.push(matchedOrganizer[0]);
                        });
                        v.organizer = organizers;
                    }
                    else
                        v.organizer = [];
                    acts.forEach(function (oneact) {
                        if (oneact._id == v._id) {
                            oneact.organizer = v.organizer;
                            oneact.summary = v.summary;
                            oneact.billstatement = v.billstatement;
                        }
                    });
                });
            }
            deferFeedback.resolve();
        }
    });
    corsAjax({
        url: getDataServerRequestUrl('activity', 'getActivityMembers'),
        data: { 'actIdlist': actIdlist },
        success: function (data) {
            if (data && validateNonEmptyArray(data.actMember)) {
                data.actMember.forEach(function (m) {
                    if (validateNonEmptyArray(data.operate)) {
                        data.operate.forEach(function (o) {
                            if (o._id == m._id) m.operate = o.operate;
                        });
                    }
                    else
                        m.operate = false;
                    acts.forEach(function (oneact) {
                        if (oneact._id == m._id) {
                            oneact.members = m.members;
                            oneact.operate = m.operate;
                        }
                    });
                });
            }
            deferMembers.resolve();
        }
    });
    return Q.all([deferFeedback.promise, deferMembers.promise]);
};

var renderOneLeadershipActivity = function (oneact) {
    var ul = $('<ul />').addClass('nav nav-tabs marginT15px');
    ul.append($('<li />').addClass('active').append($('<a />').attr('href', '#leadership_members_' + oneact._id).attr('data-toggle', 'tab').text('队员')));
    ul.append($('<li />').append($('<a />').attr('href', '#leadership_summary_' + oneact._id).attr('data-toggle', 'tab').text('活动总结')));
    ul.append($('<li />').append($('<a />').attr('href', '#leadership_billstatement_' + oneact._id).attr('data-toggle', 'tab').text('活动账目')));
    var main = $('<div />').addClass('tab-content paddingT15px');
    //renderActivityMembers from cross_leadership_members_xx.js
    var membersArea = renderActivityMembers(oneact).addClass('tab-pane active');
    //renderActivitySummary_editable from cross_leadership_summary_common.js
    var summaryArea = renderActivitySummary_editable(oneact).addClass('tab-pane');
    //renderActivityBillstatement_editable from cross_leadership_billstatement_common.js
    var billstatementArea = renderActivityBillstatement_editable(oneact).addClass('tab-pane');
    main.append(membersArea).append(summaryArea).append(billstatementArea);
    var container = $('<div />').addClass('col-xs-12 leadership_activity leadership_activity_' + oneact._id).append(ul).append(main).data('actId', oneact._id);
    $('#leadership_main').append(container);
};
