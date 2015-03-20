var renderOrgs = function (orgs) {
    var list = $('#global_index_orgList').empty();
    if(validateNonEmptyArray(orgs)) {
        orgs.sort(function (org1, org2) { return sortByDateAsc(org1, org2, 'createdOn'); });
        orgs.forEach(function (v){
            var orgView = $('<a class="col-xs-6 col-sm-6 col-md-4 col-lg-3 anchorNoneDeco" style="margin-bottom: 15px;" href="/' + v.alias + '" />');
            orgView.append($('<img class="pointerCursor img-responsive fullWidth" style="border-radius:8px;" src="' + v.logoUrl + '" alt="' + v.fullName + '" />'));
            orgView.append($('<span class="displayViewDesc">' + v.fullName + '</span>'));
            orgView.appendTo(list);
        });
    }
};

var fromWebStorage = hikerJoy_context.fastLoadOrgContext_Active();
if(fromWebStorage)
    renderOrgs(fromWebStorage);
else {
    var loadingOrgs = genereateLoadingDiv();
    loadingOrgs.appendTo($('#global_index_orgList'));
}

hikerJoy_context.getOrgContext_Active()
.then(function (orgs) {
    if(loadingOrgs) loadingOrgs.remove();
    if(hikerJoy_context.orgContextRefreshed)
        renderOrgs(orgs);
});
