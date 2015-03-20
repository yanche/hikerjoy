var actId = getQueryString().activity;

var renderNoAct = function () {
    var stg = $('<strong />').append($('<span />').text('抱歉，当前没有可以报名的活动，点击查看其它社团的')).append($('<a />').attr('href', '/global/activities').addClass('clickable').text('当前活动')).css('font-size', '18px');
    $('#signup_main').empty().append(stg).removeClass('col-xs-12 col-md-8 col-md-offset-2').addClass('row');
};

var renderActs = function (acts) {
    acts.forEach(function (v, k) {
        if (v)
            renderOneAct(v, k);
    });
    if (actId != null) {
        $('#signup_actSelector').val(actId);
        if (!$('#signup_actSelector').val())
            $('#signup_actSelector option:eq(0)').attr('selected', '');
    }
    else {
        $('#signup_actSelector option:eq(0)').attr('selected', '');
    }
    $('#signup_actSelector').trigger('change');
    $('#signup_submit').removeAttr('disabled');
};

var renderOneAct = function (act, idx) {
    if (validateNonEmptyArray(act.sheet)) {
        act.sheet.forEach(function (v) {
            var lineItem = renderOneSheetLine(v);console.log(lineItem);
            if (lineItem) {
                lineItem.addClass('signup_additionalInfo').addClass('signup_additionalInfo_' + idx).hide();
                $('#signup_main form').append(lineItem);
            }
        });
    }
    $('#signup_actSelector').append($('<option />').text(act.name).attr('value', act._id).data('index', idx));
};

var renderOneSheetLine = function (item) {
    //renderSheetLineItem_mapping comes from hikerJoy_lib.js
    var fn = renderSheetLineItem_mapping[item.type];
    if (fn) {
        return fn(item);
    }
    else {
        return null;
    }
};

$('#signup_actSelector').bind('change', function () {
    var index = Number($(this).find('option:selected').data('index'));
    $('#signup_main .signup_additionalInfo').hide();
    $('#signup_main .signup_additionalInfo_' + index).show();
});

$('#signup_submit').bind('click', function () {
    if (validateAll($('#signup_main form'))) {
        //collectSignupSheetData comes from hikerJoy_lib.js
        var selectedActId = $('#signup_actSelector').val();
        var selectedActIndex = $('#signup_actSelector option:selected').data('index');
        var signupData = collectSignupSheetData($('.signup_additionalInfo_' + selectedActIndex));
        var postData = {
            'items': signupData,
            'actId': selectedActId,
            'org': getCurrentPageOrg()
        };
        if (personalData == null) {
            var tmpUser = {};
            tmpUser.email = $('#signup_email').val();
            tmpUser.name = $('#signup_name').val();
            tmpUser.gender = $('#signup_gender').val();
            tmpUser.phone = $('#signup_phone').val();
            postData.tmpUser = tmpUser;
        }
        corsAjax({
            url: getDataServerRequestUrl('user', 'orgActSignUp'),
            data: postData,
            success: function (data) {
                if (data) {
                    doAlert({
                        'title': data.returnCode == 0 || data.returnCode == 1 ? '报名成功' : '报名失败',
                        'msg': data.msg + (data.returnCode === 1 && validateNullOrEmptyString(tmpUser.name) ? ' 由于你没有填写姓名，请尽快在"账户"中为自己起一个昵称 ^^' : ''),
                        'style': data.returnCode == 0 || data.returnCode == 1 ? 'success' : 'warning',
                        'done': function () {
                            if (data.returnCode == 1) {
                                location.reload();
                            }
                        }
                    });
                }
            }
        });
    }
});

var personalData = null;
corsAjax({
    url: getDataServerRequestUrl('user', 'getUserPersonalInfo'),
    success: function (data) {
        //for site user:
        if (data && JSON.stringify(data) !== '{}') {
            $('#signup_name').val(data.name).attr('disabled', '');
            $('#signup_gender').val(data.gender).attr('disabled', '');
            $('#signup_email').val(data.email).attr('disabled', '');
            $('#signup_phone').val(data.phone).attr('disabled', '');
            personalData = data;
        }
        else
            personalData = null;
    }
});

corsAjax({
    url: getDataServerRequestUrl('activity', 'getOpeningActs'),
    data: { 'orgAlias': getCurrentPageOrg() },
    success: function (data) {
        if (validateNonEmptyArray(data))
            renderActs(data);
        else
            renderNoAct();
    }
});
