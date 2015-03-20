var loadingActivities = genereateLoadingDiv();
$('#global_activities_main').append(loadingActivities);

corsAjax({
    url: getDataServerRequestUrl('activity', 'getOpeningActs'),
    success: function (data) {
        $(function () {
            loadingActivities.remove();
            if (validateNonEmptyArray(data)) {
                hikerJoy_context.getOrgContext() //hikerJoy_lib_cache.js
                .then(function (orgs) {
                    orgInfoContext = orgs;
                    renderActivities(data);
                });
            }
            else
                renderNoActiveActivity();
        });
    }
});

var orgInfoContext = null;

var renderNoActiveActivity = function () {
    $('#global_activities_main').append($('<text />').text('抱歉，当前没有可以参加的活动 TAT...').addClass('fontBold'));
};

var renderActivities = function (acts) {
    var container = $('#global_activities_main').empty();
    acts.sort(function (a1, a2) { return sortByDateDesc(a1, a2, 'startsOn'); }).forEach(function (oneact) {
        container.append(renderOneActivity(oneact));
    });
    container.children('div:nth-child(2n+1)').addClass('clrL');
};

var sliceActivityIntro = function (intro) {
    return (typeof intro) === 'string' & intro.trim().length > 60 ? intro.trim().slice(0, 60) + '...' : (intro || '').trim();
};

var sliceActivityName = function (name) {
    return (typeof name) === 'string' & name.trim().length > 30 ? name.trim().slice(0, 30) + '...' : (name || '').trim();
};
