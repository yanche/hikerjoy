$('#a_login').bind('click', function (e) {
    e.preventDefault();
});

$('#md_login_UserEmail, #md_login_Password').bind('keypress', 'return', function () {
    $('#md_login_btnLogin').trigger('click');
});

$('#md_login').on('show.bs.modal', function (){
    clearAll($('#md_login'));
    $('#md_login_btnResetPWD').data('stage', '1').text('重置密码').removeClass('btn-danger').addClass('btn-primary');
})
.on('shown.bs.modal', function(){
    $('#md_login_UserEmail').focus();
});

$('#md_login_btnLogin').bind('click', function () {
    if (validateAll($('#md_login'))) {
        if(hikerJoy_publicKey) {
            var ecp_pwd = hikerJoy_publicKey.encrypt($('#md_login_Password').val());
            corsAjax({
                url: getDataServerRequestUrl('security', 'authenticate'),
                data: {
                    'email': $('#md_login_UserEmail').val(),
                    'ecp_pwd': ecp_pwd
                },
                success: function (data) {
                    if (data && data.auth) {
                        $('#md_login').modal('hide');
                        location.reload();
                    }
                    else {
                        doAlert({ 'title': '登录失败啦', 'msg': '登录失败，用户名与密码不匹配', 'style': 'warning' });
                    }
                }
            });
        }
        else {
            doAlert({ 'title': '未知错误', 'msg': '请尽快联系管理员', 'style': 'warning' });
        }
    }
});

$('#md_login_btnResetPWD').bind('click', function () {
    if (validateAll($('#md_login_UserEmail').parent('div'))) {
        var stage = $(this).data('stage');
        if(stage == '1') {
            $(this).data('stage', '2').removeClass('btn-primary').addClass('btn-danger').text('确认重置');
        }
        else if (stage == '2') {
            $('#md_login button').attr('disabled', '');
            corsAjax({
                url: getDataServerRequestUrl('security', 'pwdResetRequest'),
                data: {
                    'email': $('#md_login_UserEmail').val()
                },
                success: function (data) {
                    console.log(data);
                    $('#md_login button').removeAttr('disabled');
                    if (data) {
                        doAlert({ 'title': data.returnCode == 0 ? '申请密码重置成功' : '申请密码重置失败', 'msg': data.msg, 'style': data.returnCode == 0 ? 'success' : 'warning' });
                        if(data.returnCode == 0)
                            $('#md_login').modal('hide');
                    }
                }
            });
        }
    }
});