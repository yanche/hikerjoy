
var currentOrgAlias = getCurrentPageOrg();

var loadingHistory = genereateLoadingDiv();
$('#history_main').append(loadingHistory);

corsAjax({
    url: getDataServerRequestUrl('activity', 'getHistoricalActs'),
    data: { 'orgAlias': currentOrgAlias },
    success: function (data) {
        $(function () {
            loadingHistory.remove();
            if (validateNonEmptyArray(data)) {
                //sortByDateDesc from hikerJoy_lib.js
                renderActs(data.sort(function (act1, act2) { return sortByDateDesc(act1, act2, 'startsOn'); }));
            }
        });
    }
});

var renderActs = function (acts) {
    var container = $('#history_main').empty();
    acts.forEach(function (v) {
        container.append(renderOneActivity(v));
    });
};
