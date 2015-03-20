$('#a_register').bind('click', function (e) {
    e.preventDefault();
});

$('#md_register .modal-body').find('input[type=text], input[type=password]').bind('keypress', 'return', function () {
    $('#md_register_btnRegister').trigger('click');
});

$('#md_register').on('show.bs.modal', function(){
    clearAll($('#md_register'));
    $('#md_register_emailAvailableHint, #md_register_nickNameAvailableHint').removeClass('fa-times').removeClass('fa-check');
});

$('#md_register_email').on('validating', function(){
    $('#md_register_emailAvailableHint').removeClass('fa-times').removeClass('fa-check');
}).on('validatedTrue', function(){
    var obj = $(this);
    corsAjax({
        url: getDataServerRequestUrl('user', 'userEmailAvailable'),
        data: {'email': obj.val()},
        success: function (data) {
            if(data) {
                if(data.available)
                    $('#md_register_emailAvailableHint').addClass('fa-check');
                else
                    $('#md_register_emailAvailableHint').addClass('fa-times');
            }
        }
    });
});

$('#md_register_nickName').on('validating', function(){
    $('#md_register_nickNameAvailableHint').removeClass('fa-times').removeClass('fa-check');
}).on('validatedTrue', function(){
    var obj = $(this);
    if(!validateNullOrEmptyString(obj.val())) {
        corsAjax({
            url: getDataServerRequestUrl('user', 'userNickNameAvailable'),
            data: {'nickName': obj.val()},
            success: function (data) {
                if(data) {
                    if(data.available)
                        $('#md_register_nickNameAvailableHint').addClass('fa-check');
                    else
                        $('#md_register_nickNameAvailableHint').addClass('fa-times');
                }
            }
        });
    }
});

$('#md_register_btnRegister').bind('click', function () {
    if (validateAll($('#md_register'))) {
        if(hikerJoy_publicKey) {
            var ecp_pwd = hikerJoy_publicKey.encrypt($('#md_register_pwd').val());
            corsAjax({
                url: getDataServerRequestUrl('security', 'register'),
                data: {
                    'email': $('#md_register_email').val(),
                    'ecp_pwd': ecp_pwd,
                    'name': $('#md_register_name').val(),
                    'gender': $('#md_register_gender').val(),
                    'contact': $('#md_register_contact').val() || $('#md_register_email').val(),
                    'phone': $('#md_register_phone').val(),
                    'nickName': $('#md_register_nickName').val()
                },
                success: function (data) {
                    if (data) {
                        if (data.returnCode == 0) {
                            $('#md_register').modal('hide');
                            location.reload();
                        }
                        else {
                            doAlert({ 'title': '注册失败啦', 'msg': data.msg, 'style': 'warning' });
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

$('#md_register').on('shown.bs.modal', function () {
    $('#md_register_email').focus();
});
