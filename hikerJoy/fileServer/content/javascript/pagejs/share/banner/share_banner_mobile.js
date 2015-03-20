$('#siteBanner').addClass('marginB20px');

var currentOrgAlias = getCurrentPageOrg();

var renderBanners = function (orgs) {
    var container = $('#siteBanner').empty();
    if(currentOrgAlias) {
        var org = searchOrgByAlias(orgs, currentOrgAlias);
        container.append($('<img />').addClass('fullWidth pointerCursor').attr('src', org.bannerUrl).attr('alt', org.fullName).data('url', '/'));
    }
    else {
        orgs.sort(function (org1, org2) { return sortByDateAsc(org1, org2, 'createdOn'); });
        var div = $('<div />').addClass('carousel slide').attr('data-ride', 'carousel');
        var carouselDiv = $('<div />').addClass('carousel-inner');
        orgs.forEach(function (v, k) {
            var d = $('<div />').addClass('item');
            var img = $('<img />').addClass('fullWidth pointerCursor').attr('src', v.bannerUrl).attr('alt', v.fullName).data('url', '/' + v.alias);
            carouselDiv.append(d.append(img));
        });
        carouselDiv.appendTo(div);
        container.append(div);
        div.find('.item:eq(0)').addClass('active');
        div.carousel();
    }
};

var fromWebStorage = hikerJoy_context.fastLoadOrgContext_Active();
if(fromWebStorage)
    renderBanners(fromWebStorage);
else {
    var loadingBanner = genereateLoadingDiv();
    loadingBanner.appendTo($('#siteBanner'));
}

hikerJoy_context.getOrgContext_Active()
.then(function (orgs) {
    if(loadingBanner) loadingBanner.remove();
    if(hikerJoy_context.orgContextRefreshed)
        renderBanners(orgs);
    if(currentOrgAlias) {
        var org = searchOrgByAlias(orgs, currentOrgAlias);
        $('#a_manage_gohome_mobile').text(org.shortName);
    }
});
