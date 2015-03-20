
var loadingSharingOrgs = $('<tr />').append($('<td />').attr('colspan','5').append(genereateLoadingDiv('正在加载所有社团的分享信息 ^^ ...')));
$('#admin_share_orgstable').append(loadingSharingOrgs);
corsAjax({
    url: getDataServerRequestUrl('library', 'getSharingOrgs'),
    success: function (data) {
        loadingSharingOrgs.remove();
        var sharing = new hikerJoy_sharingData(data.orgs, data.activities);
        for(var orgid in sharing.orgData) {
            var org = sharing.orgData[orgid];
            var row = $('<tr />');
            row.append($('<td />').text(org.fullName));
            row.append($('<td />').append($('<i />').addClass('fa ' + (org.shareSummary ? 'fa-check' : 'fa-times'))));
            row.append($('<td />').append($('<i />').addClass('fa ' + (org.shareBillStatement ? 'fa-check' : 'fa-times'))));
            row.append($('<td />').text(org.activitiesWithSummary));
            row.append($('<td />').text(org.activitiesWithBill));
            row.append($('<td />').text(orgStatusMapping[org.statusId]));
            $('#admin_share_orgstable').append(row);
        };
    }
});

var orgStatusMapping = {
    '10': '运行',
    '20': '停止'
};

