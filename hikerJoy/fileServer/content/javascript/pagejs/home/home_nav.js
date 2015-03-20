$(document).ready(function () {
    $('#home_nav_leadership, #home_nav_leadership_mobile').hide();
    corsAjax({
        url: getDataServerRequestUrl('activity', 'getAllActiveActsCount_MyLeadershipOrAdmin'),
        data: { 'orgAlias': getCurrentPageOrg() },
        success: function (data) {
            if (data && data.count)
                $('#home_nav_leadership, #home_nav_leadership_mobile').show();
            else
                $('#home_nav_leadership, #home_nav_leadership_mobile').hide();
        }
    });
});