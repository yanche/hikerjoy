$(document).ready(function () {
    $('#global_nav_leadership, #global_nav_leadership_mobile').hide();
    corsAjax({
        url: getDataServerRequestUrl('activity', 'getAllActiveActsCount_MyLeadershipOrAdmin'),
        data: { 'orgAlias': null },
        success: function (data) {
            if (data && data.count)
                $('#global_nav_leadership, #global_nav_leadership_mobile').show();
            else
                $('#global_nav_leadership, #global_nav_leadership_mobile').hide();
        }
    });
});