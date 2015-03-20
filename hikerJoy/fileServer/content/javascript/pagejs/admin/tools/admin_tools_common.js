$(document).ready(function () {
    WeixinApi.ready(function(api){
        api.hideOptionMenu();
    });

    $('#tools_userInjection_input').autocomplete({
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
                            if(validateNonEmptyArray(data) > 0) {
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
                $('#tools_userInjection_input').data('userId', option.item._id).val(option.item.label);
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
                    return v.email.slice(0, termLen) === term || (validateValuedString(v.name) && v.name.slice(0, termLen) === term) || (validateValuedString(v.nickName) && v.nickName.slice(0, termLen) === term);
                });
                return ret;
            }
        }
        return false;
    };

    $('#tools_btnUserInjection').bind('click', function () {
        var userId = $('#tools_userInjection_input').data('userId');
        corsAjax({
            url: getDataServerRequestUrl('admin', 'userInjection'),
            data: {'target': userId},
            success: function (data) {
                doAlert({ 'title': data.returnCode === 0 ? '用户注入成功' : '用户注入失败', 'msg': data.msg, 'style': data.returnCode === 0 ? 'success' : 'warning' });
                if(data.returnCode === 0)
                    location.reload();
            }
        });
    });
});