var renderNoAct = function () {
    var stg = $('<strong />').css('font-size', '18px');
    stg.append($('<span />').text('抱歉，当前没有可以报名的活动，点击查看其它社团的'));
    stg.append($('<a />').addClass('clickable').text('当前活动').attr('href', '/global/activities'));
    $('#orgActs_view').empty().append(stg);
};

var currentOrgAlias = getCurrentPageOrg();

var loadingRoutes = genereateLoadingDiv();
$('#orgActs_view').append(loadingRoutes);
corsAjax({
    url: getDataServerRequestUrl('activity', 'getOpeningActs'),
    data: { 'orgAlias': currentOrgAlias },
    success: function (data) {
        $(function () {
            loadingRoutes.remove();
            if(validateNonEmptyArray(data))
                renderActs(data);
            else
                renderNoAct();
        });
    }
});
