var loadingOrgIntro = genereateLoadingDiv();
loadingOrgIntro.appendTo($('#org_intro'));

corsAjax({
    url: getDataServerRequestUrl('org', 'getOrgIntro'),
    data: { 'orgAlias': getCurrentPageOrg() },
    success: function (data) {
        loadingOrgIntro.remove();
        var container = $('#org_intro');
        if (validateNonEmptyArray(data.intro))
            container.html(htmlPostArrayToHtml(data.intro));
    }
});

$(function () {
    $('#home_nav_orgintro').addClass('active');
});
