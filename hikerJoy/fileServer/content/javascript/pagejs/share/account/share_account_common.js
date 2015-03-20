$('#a_account').bind('click', function (e) {
    e.preventDefault();
});

corsAjax({
    url: getDataServerRequestUrl('user', 'getUserName'),
    success: function (data) {
        if(data && data.name) {
            $('#a_account span').text(' ' + data.name);
        }
    }
});

$('#md_account_basicInfo_btnUpdatePersonalInfo').bind('click', function (){
    if(validateAll($('#md_account_basicInfo'))) {
        var info = {
            'name': $('#md_account_basicInfo_name').val(),
            'gender': $('#md_account_basicInfo_gender').val(),
            'email': $('#md_account_basicInfo_email').val(),
            'phone': $('#md_account_basicInfo_phone').val(),
            'nickName': $('#md_account_basicInfo_nickName').val()
        };
        var btn = $(this);
        btn.attr('disabled', '');
        corsAjax({
            url: getDataServerRequestUrl('user', 'updateUserPersonalInfo'),
            data: info,
            success: function (data) {
                console.log(data);
                btn.removeAttr('disabled');
                if(data) {
                    doAlert({ 'title': data.returnCode == 0 ? '更新个人信息成功' : '更新个人信息失败', 'msg': data.msg, 'style': data.returnCode == 0 ? 'success' : 'warning' });
                }
                if(data && data.returnCode == 0) {
                    $('#md_account').modal('hide');
                    $('#a_account span').text(info.name ? (' ' + info.name) : ' 账户');
                }
            }
        });
    }
});

$('#md_account_changePwd_newPwd').tooltip();

$('#md_account').on('show.bs.modal', function(){
    clearAll($('#md_account'));
    $('#md_account_changeEmail_availableHint, #md_account_nickNameAvailableHint').removeClass('fa-times').removeClass('fa-check');
    corsAjax({
        url: getDataServerRequestUrl('user', 'getUserEmail'),
        success: function (data) {
            $('#md_account_changeEmail_current').text(data.email);
        }
    });
    corsAjax({
        url: getDataServerRequestUrl('user', 'getUserPersonalInfo'),
        success: function (data) {
            renderPersonalInfoForm(data);
        }
    });
});

var renderPersonalInfoForm = function (data) {
    $('#md_account_basicInfo_name').val(data.name);
    $('#md_account_basicInfo_gender').val(data.gender);
    $('#md_account_basicInfo_email').val(data.email);
    $('#md_account_basicInfo_phone').val(data.phone);
    $('#md_account_basicInfo_nickName').val(data.nickName).data('original', data.nickName);
};

$('#md_account_changeEmail_newEmail').on('validating', function(){
    $('#md_account_changeEmail_availableHint').removeClass('fa-times').removeClass('fa-check');
}).on('validatedTrue', function(){
    var obj = $(this);
    corsAjax({
        url: getDataServerRequestUrl('user', 'userEmailAvailable'),
        data: {'email': obj.val()},
        success: function (data) {
            console.log(data);
            if(data) {
                if(data.available)
                    $('#md_account_changeEmail_availableHint').addClass('fa-check');
                else
                    $('#md_account_changeEmail_availableHint').addClass('fa-times');
            }
        }
    });
});

$('#md_account_changePwd_originPwd, #md_account_changePwd_newPwd, #md_account_changePwd_newPwd2').bind('keypress', 'return', function () {
    $('#md_account_changePwd_btnChangePwd').trigger('click');
});

$('#md_account_changePwd_btnChangePwd').bind('click', function(){
    if(validateAll($('#md_account_changePwd'))) {
        if(hikerJoy_publicKey) {
            var ecp_originPwd = hikerJoy_publicKey.encrypt($('#md_account_changePwd_originPwd').val());
            var ecp_newPwd = hikerJoy_publicKey.encrypt($('#md_account_changePwd_newPwd').val());
            $(this).attr('disabled', '');
            corsAjax({
                url: getDataServerRequestUrl('security', 'changePwd'),
                data: {
                    'ecp_originPwd': ecp_originPwd,
                    'ecp_newPwd': ecp_newPwd
                },
                success: function (data) {
                    $('#md_account_changePwd_btnChangePwd').removeAttr('disabled');
                    if(data) {
                        if (data.returnCode == 0) {
                            doAlert({ 'title': '修改密码成功', 'msg': data.msg, 'style': 'success', 'done': function () { $('#md_account').modal('hide'); } });
                        }
                        else {
                            doAlert({ 'title': '修改密码失败', 'msg': data.msg, 'style': 'warning' });
                        }
                    }
                }
            });
        }
        else {
            doAlert({ 'title': '未知错误', 'msg': '请尽快联系管理员', 'style': 'warning' });
        }
    }
});

$('#md_account_changeEmail_newEmail, #md_account_changeEmail_newEmail2, #md_account_changeEmail_pwd').bind('keypress', 'return', function () {
    $('#md_account_changeEmail_btnChangeEmail').trigger('click');
});

$('#md_account_changeEmail_btnChangeEmail').bind('click', function(){
    if(validateAll($('#md_account_changeEmail'))) {
        if(hikerJoy_publicKey) {
            var ecp_pwd = hikerJoy_publicKey.encrypt($('#md_account_changeEmail_pwd').val());
            $(this).attr('disabled', '');
            corsAjax({
                url: getDataServerRequestUrl('security', 'updateUserEmail'),
                data: {
                    'email': $('#md_account_changeEmail_newEmail').val(),
                    'ecp_pwd': ecp_pwd
                },
                success: function (data) {
                    $('#md_account_changeEmail_btnChangeEmail').removeAttr('disabled');
                    if(data) {
                        if (data.returnCode == 0) {
                            doAlert({ 'title': '修改登录邮箱成功', 'msg': data.msg, 'style': 'success', 'done': function () { $('#md_account').modal('hide'); } });
                        }
                        else {
                            doAlert({ 'title': '修改登录邮箱失败', 'msg': data.msg, 'style': 'warning' });
                        }
                    }
                }
            });
        }
        else {
            doAlert({ 'title': '未知错误', 'msg': '请尽快联系管理员', 'style': 'warning' });
        }
    }
});

$('#md_account_basicInfo_nickName').on('validating', function(){
    $('#md_account_nickNameAvailableHint').removeClass('fa-times').removeClass('fa-check');
}).on('validatedTrue', function(){
    var obj = $(this);
    if(!validateNullOrEmptyString(obj.val()) && obj.data('original') !== obj.val()) {
        corsAjax({
            url: getDataServerRequestUrl('user', 'userNickNameAvailable'),
            data: {'nickName': obj.val()},
            success: function (data) {
                if(data) {
                    if(data.available)
                        $('#md_account_nickNameAvailableHint').addClass('fa-check');
                    else
                        $('#md_account_nickNameAvailableHint').addClass('fa-times');
                }
            }
        });
    }
});
