$(document).ready(function () {
    var orgContext = null;

    hikerJoy_context.getOrgContext()
    .then(function (orgs) {
        orgContext = orgs;
        initializePage();
    });

    var initializePage = function () {
        var activeBody = $('#orgs_active_tbody').empty();
        var inactiveBody = $('#orgs_inactive_tbody').empty();
        var active = searchActiveOrg(orgContext).sort(function (v1, v2) { return sortByDateAsc(v1, v2, 'createdOn'); });
        var inactive = searchInactiveOrg(orgContext).sort(function (v1, v2) { return sortByDateAsc(v1, v2, 'createdOn'); });
        renderActiveOrgs(activeBody, active);
        renderInactiveOrgs(inactiveBody, inactive);
    };

    var renderActiveOrgs = function (container, orgs) {
        container.empty();
        if (Array.isArray(orgs) && orgs.length > 0) {
            orgs.forEach(function (org, k) {
                var row = $('<tr />').data('orgId', org._id).data('org', org);
                var td1 = $('<td />').append($('<i />').addClass('fa fa-edit pointerCursor hoverRed updateOrg').css('margin-right', '10px')).append($('<i />').addClass('fa fa-times pointerCursor hoverRed disactivateOrg'));
                var td2 = $('<td />').text(org.alias);
                var td3 = $('<td />').text(org.shortName);
                var td4 = $('<td />').text(org.fullName);
                row.append(td1).append(td2).append(td3).append(td4);
                container.append(row);
            });
        }
    };

    var renderInactiveOrgs = function (container, orgs) {
        container.empty();
        if (Array.isArray(orgs) && orgs.length > 0) {
            orgs.forEach(function (org, k) {
                var row = $('<tr />').data('orgId', org._id).data('org', org);
                var td1 = $('<td />').append($('<i />').addClass('fa fa-edit pointerCursor hoverRed updateOrg').css('margin-right', '10px')).append($('<i />').addClass('fa fa-check pointerCursor hoverRed reactivateOrg'));
                var td2 = $('<td />').text(org.alias);
                var td3 = $('<td />').text(org.shortName);
                var td4 = $('<td />').text(org.fullName);
                row.append(td1).append(td2).append(td3).append(td4);
                container.append(row);
            });
        }
    };

    $('#orgs_active_tbody, #orgs_inactive_tbody').on('click', '.updateOrg', function () {
        clearAll($('#md_admin_orgsEdit'));
        var data = $(this).parents('tr').data('org');
        $('#md_admin_orgsEdit_alias').val(data.alias);
        $('#md_admin_orgsEdit_short').val(data.shortName);
        $('#md_admin_orgsEdit_full').val(data.fullName);
        $('#md_admin_orgsEdit_submit').data('orgId', data._id);
        $('#md_admin_orgsEdit').modal('show');
    });

    $('#orgs_addOrg').bind('click', function () {
        clearAll($('#md_admin_orgsEdit'));
        $('#md_admin_orgsEdit_submit').data('orgId', '');
        $('#md_admin_orgsEdit').modal('show');
    });

    $('#orgs_inactive_tbody').on('click', '.reactivateOrg', function () {
        var orgId = $(this).parents('tr').data('orgId');
        corsAjax({
            url: getDataServerRequestUrl('admin', 'reactivateOrg'),
            data: { 'orgId': orgId },
            success: function (data) {
                if (data) {
                    if (data.returnCode === 0) {
                        var activated = searchOrgById(orgContext, orgId);
                        if (activated) activated.statusId = 10;
                        initializePage(); //re-load
                    }
                    else
                        doAlert({ 'title': '重新激活组织失败', 'msg': data.msg, 'style': 'warning' });
                }
            }
        });
    });

    $('#orgs_active_tbody').on('click', '.disactivateOrg', function () {
        var orgId = $(this).parents('tr').data('orgId');
        corsAjax({
            url: getDataServerRequestUrl('admin', 'disactivateOrg'),
            data: { 'orgId': orgId },
            success: function (data) {
                if (data) {
                    if (data.returnCode === 0) {
                        var inactivated = searchOrgById(orgContext, orgId);
                        if (inactivated) inactivated.statusId = 20;
                        initializePage(); //re-load
                    }
                    else
                        doAlert({ 'title': '停运组织失败', 'msg': data.msg, 'style': 'warning' });
                }
            }
        });
    });

    $('#md_admin_orgsEdit_submit').bind('click', function () {
        if (validateAll($('#md_admin_orgsEdit'))) {
            var btns = $('#md_admin_orgsEdit_submit, #md_admin_orgsEdit_cancel').attr('disabled', '');
            var orgId = $('#md_admin_orgsEdit_submit').data('orgId');
            if (orgId) {
                alias = $('#md_admin_orgsEdit_alias').val();
                shortName = $('#md_admin_orgsEdit_short').val();
                fullName = $('#md_admin_orgsEdit_full').val();
                corsAjax({
                    url: getDataServerRequestUrl('admin', 'updateOrgBasicInfo'),
                    data: {
                        'orgId': orgId,
                        'alias': alias,
                        'shortName': shortName,
                        'fullName': fullName
                    },
                    success: function (data) {
                        btns.removeAttr('disabled');
                        if (data) {
                            if (data.returnCode === 0) {
                                var updated = searchOrgById(orgContext, orgId);
                                if (updated) {
                                    updated.statusId = 10;
                                    updated.alias = alias;
                                    updated.shortName = shortName;
                                    updated.fullName = fullName;
                                }
                                $('#md_admin_orgsEdit').modal('hide');
                                initializePage(); //re-load
                            }
                            else
                                doAlert({ 'title': '更新组织信息失败', 'msg': data.msg, 'style': 'warning' });
                        }
                    }
                });
            }
            else {
                alias = $('#md_admin_orgsEdit_alias').val();
                shortName = $('#md_admin_orgsEdit_short').val();
                fullName = $('#md_admin_orgsEdit_full').val();
                corsAjax({
                    url: getDataServerRequestUrl('admin', 'createNewOrg'),
                    data: {
                        'alias': alias,
                        'shortName': shortName,
                        'fullName': fullName
                    },
                    success: function (data) {
                        btns.removeAttr('disabled');
                        if (data) {
                            if (data.returnCode === 0) {
                                if (orgContext) orgContext.push({ '_id': data.orgId, 'alias': alias, 'shortName': shortName, 'fullName': fullName, 'statusId': 10 });
                                $('#md_admin_orgsEdit').modal('hide');
                                initializePage(); //re-load
                            }
                            else
                                doAlert({ 'title': '添加组织失败', 'msg': data.msg, 'style': 'warning' });
                        }
                    }
                });
            }
        }
    });

    $('#md_admin_orgsEdit_cancel').bind('click', function () {
        $('#md_admin_orgsEdit').modal('hide');
    });
});
