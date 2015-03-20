
var loadingUnauthUsers = genereateLoadingDiv('正在加载被禁言的用户');
$('#forum_auth_unauthUsersArea').append(loadingUnauthUsers);
corsAjax({
    url: getDataServerRequestUrl('forum', 'getUnauthorizedUsers'),
    data: { 'orgAlias': getCurrentPageOrg() },
    success: function (data) {
        loadingUnauthUsers.remove();
        if (validateNonEmptyArray(data)) {
            renderUnauthorizedUsers(data);
        }
    }
});

var renderUnauthorizedUsers = function (users) {
    var area = $('#forum_auth_unauthUsersArea').empty();
    users.forEach(function (user) {
        area.append(renderOneUnauthorizedUser(user));
    });
};

var renderOneUnauthorizedUser = function (user) {
    var container = $('<span />').addClass('forumUnauthorizedUser').text(generateLabelForUserAutoComplete(user));
    container.append($('<i />').addClass('fa fa-recycle pointerCursor hoverYellowgreen').data('userId', user._id).bind('click', reAuthUser2Forum).css('position', 'relative').css('top', '2px').css('margin-left', '3px'));
    return container;
};

var reAuthUser2Forum = function () {
    var obj = $(this);
    corsAjax({
        url: getDataServerRequestUrl('forum', 'authorizeUserToPost'),
        data: { 'orgAlias': getCurrentPageOrg(), 'userId': obj.data('userId') },
        success: function (data) {
            if(data) {
                if(data.returnCode !== 0)
                    doAlert({ 'title': '用户解除禁言失败', 'msg': data.msg, 'style': 'warning' });
                else
                    obj.parents('.forumUnauthorizedUser').remove();
            }
        }
    });
};

$('#forum_auth_inputUnauthUser').autocomplete({
    source: function (req, res) {
        var term = req.term.trim();
        if(term.length === 0) {
            res([]);
        }
        else {
            var fromCache = getUsersFromCache(term);
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
                        }
                        else {
                            data = [];
                        }
                        res(data);
                        usersCache[term] = data;
                    }
                });
            }
        }
    },
    minLength: 1,
    select: function (e, option) {
        if(option.item) {
            $('#forum_auth_inputUnauthUser').data('userId', option.item._id).val(option.item.label);
            return false;
        }
    }
});
    
var usersCache = [];

var getUsersFromCache = function (term) {
    term = term.trim();
    if(term.length === 0)
        return false;
                 
    var termLen = term.length;
    for(var idx in usersCache) {
        var len = idx.length;
        if(termLen >= len && idx === term.slice(0, len)) {
            var ret = usersCache[idx].filter(function (v, k) {
                return (validateValuedString(v.nickName) && v.nickName.slice(0, termLen) === term) || (validateValuedString(v.nickName) && v.name.slice(0, termLen) === term) || v.email.slice(0, termLen) === term;
            });
            return ret;
        }
    }
    return false;
};

$('#forum_auth_btnUnauthUser').bind('click', function () {
    var input = $('#forum_auth_inputUnauthUser'), btn = $(this);
    var userId = input.data('userId');
    if(!userId)
        setError(input.parent('div'));
    else {
        corsAjax({
            url: getDataServerRequestUrl('forum', 'unauthorizeUserToPost'),
            data: { 'orgAlias': getCurrentPageOrg(), 'userId': userId },
            success: function (data) {
                if(data) {
                    if(data.returnCode !== 0)
                        doAlert({ 'title': '用户禁言失败', 'msg': data.msg, 'style': 'warning' });
                    else
                        location.reload();
                }
            }
        });
    }
});
