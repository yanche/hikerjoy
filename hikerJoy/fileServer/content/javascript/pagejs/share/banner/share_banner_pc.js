var currentOrgAlias = getCurrentPageOrg();

var renderBanners = function (orgs) {
    var container = $('#siteBanner').empty();
    if(currentOrgAlias) {
        var org = searchOrgByAlias(orgs, currentOrgAlias);
        container.append($('<img />').addClass('fullWidth pointerCursor').attr('src', org.bannerUrl).attr('alt', org.fullName).data('url', '/'));
    }
    else {
        orgs.sort(function (org1, org2) { return sortByDateAsc(org1, org2, 'createdOn'); });
        var div = $('<div />').addClass('carousel slide').attr('data-ride', 'carousel').attr('id', 'banner_global');
        var carouselDiv = $('<div />').addClass('carousel-inner');
        orgs.forEach(function (v, k) {
            var d = $('<div />').addClass('item');
            var img = $('<img />').addClass('fullWidth pointerCursor').attr('src', v.bannerUrl).attr('alt', v.fullName).data('url', '/' + v.alias);
            carouselDiv.append(d.append(img));
        });
        carouselDiv.appendTo(div);
        if (orgs.length > 1) {
            $('<a class="left carousel-control" href="#banner_global" data-slide="prev" style="width:10%;"><span style="position:absolute;top:40%;left:45%;" class="fa fa-angle-left"></span></a>').appendTo(div);
            $('<a class="right carousel-control" href="#banner_global" data-slide="next" style="width:10%;"><span style="position:absolute;top:40%;right:45%;" class="fa fa-angle-right"></span></a>').appendTo(div);
        }
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
        $('#home_nav_dropdowntitle, #a_manage_gohome').text(org.shortName);
    }
});
