$('#org_users_newAdmin').bind('keypress', 'return', function () {
    $('#org_users_addNewAdminBtn').focus().trigger('click');
}).val('').focus();

var getOrgAdmin = function () {
    var loadingAdmins = genereateLoadingDiv('正在加载组织管理员名单...');
    $('#org_users_orgAdminView').empty().append(loadingAdmins);
    corsAjax({
        url: getDataServerRequestUrl('org', 'getOrgAdmin'),
        data: {'orgAlias': getCurrentPageOrg()},
        success: function (data) {
            loadingAdmins.remove();
            renderOrgAdmins(data);
        }
    });
};

getOrgAdmin();

var renderOrgAdmins = function (data) {
    var table = $('<table />').addClass('table table-responsive table-striped table-hover').css('text-align', 'center');
    var head = renderOrgAdminsTableHeader();
    var body = $('<tbody />');
    if(validateNonEmptyArray(data)) {
        data.forEach(function (v) {
            body.append(renderOneOrgAdmin(v));
        });
    }
    $('#org_users_orgAdminView').empty().append(table.append(head).append(body));
};

var renderOrgAdminsTableHeader = function () {
    var head = $('<thead />');
    var row = $('<tr />');
    row.append($('<th />'));
    row.append($('<th />').text('邮箱'));
    row.append($('<th />').text('姓名'));
    row.append($('<th />').text('昵称'));
    row.append($('<th />').text('手机'));
    return head.append(row);
};

var renderOneOrgAdmin = function (data) {
    var row = $('<tr />');
    row.append($('<td />').append($('<i />').addClass('fa fa-times hoverRed orgAdminRemover pointerCursor').data('userId', data._id).bind('click', removeOrgAdmin)));
    row.append($('<td />').text(data.personalInfo.email));
    row.append($('<td />').text(data.personalInfo.name || ''));
    row.append($('<td />').text(data.nickName || ''));
    row.append($('<td />').text(data.personalInfo.phone || ''));
    return row;
};

$('#org_users_addNewAdminBtn').bind('click', function () {
    var userId = $('#org_users_newAdmin').data('userId');
    if(!userId)
        setError($('#org_users_newAdmin').parent('div'));
    else {
        var btn = $(this);
        btn.attr('disabled', '');
        rmvError($('#org_users_newAdmin').parent('div'));
        corsAjax({
            url: getDataServerRequestUrl('org', 'grantUserOrgAdmin'),
            data: {'orgAlias': getCurrentPageOrg(), 'userId': userId},
            success: function (data) {
                btn.removeAttr('disabled');
                if(data) {
                    doAlert({ 'title': data.returnCode === 0 ? '授权成功' : '授权失败', 'msg': data.msg, 'style': data.returnCode === 0 ? 'success' : 'warning' });
                    if(data.returnCode === 0) {
                        getOrgAdmin();
                        $('#org_users_newAdmin').val('');
                    }
                    $('#org_users_newAdmin').focus();
                }
            }
        });
    }
});

var removeOrgAdmin = function () {
    var userId = $(this).data('userId');
    var row = $(this).parents('tr');
    removeOrgAdminAlert()
    .then(function (confirm) {
        if(confirm) {
            corsAjax({
                url: getDataServerRequestUrl('org', 'removeOrgAdmin'),
                data: {'orgAlias': getCurrentPageOrg(), 'userId': userId},
                success: function (data) {
                    if(data) {
                        doAlert({ 'title': data.returnCode === 0 ? '移除成功' : '移除失败', 'msg': data.msg, 'style': data.returnCode === 0 ? 'success' : 'warning' });
                        if(data.returnCode === 0) {
                            row.remove();
                        }
                    }
                }
            });
        }
    })
};

var removeOrgAdminAlert = function () {
    var defer = new Q.defer();
    $('#org_md_removeOrgAdmin .btn-success').unbind('click').bind('click', function () {
        defer.resolve(false);
    });
    $('#org_md_removeOrgAdmin .btn-danger').unbind('click').bind('click', function () {
        defer.resolve(true);
    });
    $('#org_md_removeOrgAdmin').modal({ 'backdrop': 'static', 'keyboard': false });
    return defer.promise;
};
    
$('#org_users_newAdmin').autocomplete({
    source: function (req, res) {
        var term = req.term.trim();
        if(term.length === 0) {
            res([]);
        }
        else {
            var fromCache = getUserLeaderFromCache(term);
            if(fromCache) {
                res(fromCache);
            }
            else {
                corsAjax({
                    url: getDataServerRequestUrl('user', 'queryUserByNickNameOrNameOrEmail'),
                    data: {'query': term},
                    success: function (data) {
                        if(validateNonEmptyArray(data)) {
                            var data = data.map(function(v, k){
                                v.label = generateLabelForUserAutoComplete(v);
                                return v;
                            });
                            res(data);
                            userLeadersCache[term] = data;
                        }
                        else
                            userLeadersCache[term] = [];
                    }
                });
            }
        }
    },
    minLength: 1,
    select: function (e, option) {
        if(option.item) {
            $('#org_users_newAdmin').val(option.item.label).data('userId', option.item._id);
            return false;
        }
    }
});
    
var userLeadersCache = [];

var getUserLeaderFromCache = function (term) {
    term = term.trim();
    if(term.length === 0)
        return false;
                 
    var termLen = term.length;
    for(var idx in userLeadersCache) {
        var len = idx.length;
        if(termLen >= len && idx === term.slice(0, len)) {
            var ret = userLeadersCache[idx].filter(function (v, k) {
                return v.email.slice(0, termLen) === term || (validateValuedString(v.name) && v.name.slice(0, termLen) === term) || (validateValuedString(v.nickName) && v.nickName.slice(0, termLen) === term);
            });
            return ret;
        }
    }
    return false;
};