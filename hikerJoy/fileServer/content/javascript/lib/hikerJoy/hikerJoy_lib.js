var getDataServerRequestUrl = function (dir, sub) {
    //host: 'hostname:port'
    return window.location.protocol + '//' + window.location.hostname + ':' + 1337 + '/' + dir + '/' + sub;
};

var getCurrentPageOrg = function () {
    if (isCurrentPageGlobal())
        return '';
    else
        return window.location.pathname.split('/')[1].toLowerCase();
};

var getFileServerRequestUrl = function (dir, sub) {
    return window.location.protocol + '//' + window.location.host + '/' + dir + '/' + sub;
}

var isCurrentPageGlobal = function () {
    var org = window.location.pathname.split('/')[1].toLowerCase();
    return org.length == 0 || ['global', 'forum', 'admin', 'security', 'library'].contains(org);
};

var getQueryString = function () {
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; ++i) {
        var pair = vars[i].split('=');
        if (pair[0].length == 0 || pair[1] == undefined)
            continue;

        pair[0] = pair[0].trim();
        pair[1] = pair[1].trim();
        //first entry
        if ((typeof query_string[pair[0]]) === 'undefined') {
            query_string[pair[0]] = pair[1];
        }//second time
        else if ((typeof query_string[pair[0]]) === 'string') {
            //change to an array
            query_string[pair[0]] = [query_string[pair[0]], pair[1]];
        }//third time
        else {
            //add an item to array
            query_string[pair[0]].push(pair[1]);
        }
    }
    return query_string;
};

//TODO: check input
var corsAjax = function (option) {
    var postdata = option.data || {};
    postdata.__antiForgeryToken = $('html').attr('token');
    $.ajax({
        url: option.url,
        type: option.method || 'POST',
        data: JSON.stringify(postdata), //will use JSON.parse at server side
        dataType: 'json',
        xhrFields: { withCredentials: true },
        crossDomain: true,
        success: function (data, status, xhr) {
            if (option.success)
                option.success(data, status, xhr);
        },
        error: function (xhr, status, err) {
            if (err) {
                if (doAlert)
                    doAlert({ 'title': '页面错误', 'msg': '抱歉！页面出错啦，请尝试刷新，如仍然无法正常使用，请联系yanche.belongs@gmail.com', 'style': 'warning' });
                else
                    alert('抱歉！页面出错啦，请尝试刷新，如仍然无法正常使用，请联系yanche.belongs@gmail.com');
            }
        }
    });
};

var reportPageFail = function (obj) {
    corsAjax({
        'url': getDataServerRequestUrl('pagefail', 'pageFail'),
        'data': obj
    });
};

window.onerror = function () {
    var errorObj = {
        'msg': arguments[0],
        'file': arguments[1],
        'line': arguments[2],
        'column': arguments[3],
        'stack': arguments[4] ? arguments[4].stack || 'no stack obj on arguments[4]' : 'no arguments[4]'
    };
    reportPageFail(errorObj);
};

//arg: {'label':, 'type':, 'children':}
var renderSignUpSheet_text = function (arg) {
    if (!arg || arg.type !== 'text')
        return null;

    var row = $('<div />').addClass('form-group');
    var label = $('<label>' + arg.label + '</label>').addClass('col-sm-2 control-label');
    var content = $('<div />').addClass('col-sm-9').append($('<input type="text" />').addClass('form-control signUpSheet_text').data('label', arg.label));
    row.append(label).append(content);
    return row;
};

//arg: {'label':, 'type':, 'children':}
var renderSignUpSheet_textArea = function (arg) {
    if (!arg || arg.type !== 'textarea')
        return null;

    var row = $('<div />').addClass('form-group');
    var label = $('<label>' + arg.label + '</label>').addClass('col-sm-2 control-label');
    var content = $('<div />').addClass('col-sm-9').append($('<textarea />').addClass('form-control signUpSheet_textarea').css('height', '150px').data('label', arg.label));
    row.append(label).append(content);
    return row;
};

//arg: {'label':, 'type':, 'children':}
var renderSignUpSheet_image = function (arg) {
    if (!arg || arg.type !== 'image')
        return null;

    var row = $('<div />').addClass('form-group');
    var btn = $('<span class="btn btn-default fileinput-button"><i class="fa fa-plus"></i><span> ' + arg.label + '</span><input class="signUpSheet_image_uploadBtn" type="file"></input></span>');
    var label = $('<label />').addClass('col-sm-2 control-label').append(btn);
    var review = $('<img />').attr('src', '/content/image/upload_image_default.jpg').addClass('img-responsive signUpSheet_image').css('width', '100%').css('border', 'solid 1px black').css('border-radius', '10px').data('label', arg.label);
    bindEvent2ImageBtnAndReviewer(btn.find('.signUpSheet_image_uploadBtn'), review);
    var content = $('<div />').addClass('col-sm-9').append(review);
    row.append(label).append(content);
    return row;
};

//arg: {'label':, 'type':, 'children':}
var renderSignUpSheet_select = function (arg) {
    if (!arg || arg.type !== 'select' || !Array.isArray(arg.children) || arg.children.length === 0)
        return null;

    var row = $('<div />').addClass('form-group');
    var label = $('<label>' + arg.label + '</label>').addClass('col-sm-2 control-label');
    var select = $('<select />').addClass('form-control signUpSheet_select').data('label', arg.label);
    arg.children.forEach(function (v, k) {
        select.append($('<option value="' + v + '">' + v + '</option>'));
    });
    var content = $('<div />').addClass('col-sm-9').append(select);
    row.append(label).append(content);
    return row;
};

//arg: {'label':, 'type':, 'children':}
var renderSignUpSheet_checkBoxPanel = function (arg) {
    if (!arg || arg.type !== 'multi-select' || !Array.isArray(arg.children) || arg.children.length === 0)
        return null;

    var row = $('<div />').addClass('form-group');
    var label = $('<label>' + arg.label + '</label>').addClass('col-sm-2 control-label');
    var content = $('<div />').addClass('col-sm-9 signUpSheet_multiSelect').data('label', arg.label).css('margin-bottom', '-15px');
    arg.children.forEach(function (v, k) {
        var chkBox = $('<span />').text(v).addClass('signUpSheetChk').data('value', v).data('stage', '0').append($('<i/>').addClass('fa fa-times').css('margin-left', '3px'));
        chkBox.bind('click', signUpSheetChkClick);
        chkBox.bind('refreshDisplay', refreshDisplay_signUpSheetChk);
        chkBox.appendTo(content);
    });
    row.append(label).append(content);
    return row;
};

var signUpSheetChkClick = function () {
    var obj = $(this);
    if (obj.data('stage') == '0') { //uncheck -> check
        obj.data('stage', '1').trigger('refreshDisplay');
    }
    else { //check -> uncheck
        obj.data('stage', '0').trigger('refreshDisplay');
    }
};

var refreshDisplay_signUpSheetChk = function () {
    var obj = $(this);
    if (obj.data('stage') == '0') { //uncheck -> check
        obj.css('background-color', 'white').find('i').removeClass('fa-check').addClass('fa-times');
    }
    else { //check -> uncheck
        obj.css('background-color', '#5cb85c').find('i').removeClass('fa-times').addClass('fa-check');
    }
};

//arg: {'label':, 'type':, 'children':}
var renderSignUpSheet_date = function (arg) {
    if (!arg || arg.type !== 'date')
        return null;

    var row = $('<div />').addClass('form-group');
    var label = $('<label>' + arg.label + '</label>').addClass('col-sm-2 control-label');
    var dateInput = $('<input type="text" />').addClass('form-control signUpSheet_date').data('label', arg.label);
    dateInput.datepicker(defaultDatePickerOption);
    var content = $('<div />').addClass('col-sm-9').append(dateInput);
    row.append(label).append(content);
    return row;
};

//arg: {'label':, 'type': }
var renderSignUpSheet_weixin = function (arg) {
    if (!arg || arg.type !== 'weixin')
        return null;

    var row = $('<div />').addClass('form-group');
    var label = $('<label>' + arg.label + '</label>').addClass('col-sm-2 control-label');
    var weixinInput = $('<input type="text" />').addClass('form-control signUpSheet_weixin').data('label', arg.label);
    var content = $('<div />').addClass('col-sm-9').append(weixinInput);
    row.append(label).append(content);
    return row;
};

var renderSheetLineItem_mapping = {
    'text': renderSignUpSheet_text,
    'textarea': renderSignUpSheet_textArea,
    'image': renderSignUpSheet_image,
    'select': renderSignUpSheet_select,
    'multi-select': renderSignUpSheet_checkBoxPanel,
    'date': renderSignUpSheet_date,
    'weixin': renderSignUpSheet_weixin
};

var sheetLineTypeForDownloading = ['text', 'date', 'textarea', 'select', 'weixin', 'multi-select'];

var collectSignupSheetData_text = function (scope) {
    var ret = [];
    var targets = scope.find('.signUpSheet_text').each(function () {
        var obj = $(this);
        var label = obj.data('label');
        var value = obj.val();
        ret.push({ 'label': label, 'type': 'text', 'value': value });
    });
    return ret;
};

var collectSignupSheetData_textArea = function (scope) {
    var ret = [];
    var targets = scope.find('.signUpSheet_textarea').each(function () {
        var obj = $(this);
        var label = obj.data('label');
        var value = obj.val();
        ret.push({ 'label': label, 'type': 'textarea', 'value': value });
    });
    return ret;
};

var collectSignupSheetData_select = function (scope) {
    var ret = [];
    var targets = scope.find('.signUpSheet_select').each(function () {
        var obj = $(this);
        var label = obj.data('label');
        var value = obj.val();
        ret.push({ 'label': label, 'type': 'select', 'value': value });
    });
    return ret;
};

var collectSignupSheetData_multiSelect = function (scope) {
    var ret = [];
    var targets = scope.find('.signUpSheet_multiSelect').each(function () {
        var obj = $(this);
        var label = obj.data('label');
        var val = [];
        obj.find('.signUpSheetChk').each(function (i, e) {
            var chk = $(e);
            if (chk.data('stage') == '1')
                val.push(chk.data('value'));
        });
        ret.push({ 'label': label, 'type': 'multi-select', 'value': val });
    });
    return ret;
};

var collectSignupSheetData_image = function (scope) {
    var ret = [];
    var targets = scope.find('.signUpSheet_image').each(function () {
        var obj = $(this);
        var label = obj.data('label');
        var value = obj.attr('src');
        ret.push({ 'label': label, 'type': 'image', 'value': value });
    });
    return ret;
};

var collectSignupSheetData_date = function (scope) {
    var ret = [];
    var targets = scope.find('.signUpSheet_date').each(function () {
        var obj = $(this);
        var label = obj.data('label');
        var value = obj.val();
        ret.push({ 'label': label, 'type': 'date', 'value': value });
    });
    return ret;
};

var collectSignupSheetData_weixin = function (scope) {
    var ret = [];
    var targets = scope.find('.signUpSheet_weixin').each(function () {
        var obj = $(this);
        var label = obj.data('label');
        var value = obj.val();
        ret.push({ 'label': label, 'type': 'weixin', 'value': value });
    });
    return ret;
};

var collectSignupSheetData = function (scope) {
    var textData = collectSignupSheetData_text(scope);
    var textareaData = collectSignupSheetData_textArea(scope);
    var selectData = collectSignupSheetData_select(scope);
    var multiSelectData = collectSignupSheetData_multiSelect(scope);
    var imageData = collectSignupSheetData_image(scope);
    var dateData = collectSignupSheetData_date(scope);
    var weixinData = collectSignupSheetData_weixin(scope);
    return textData.concat(textareaData, selectData, multiSelectData, imageData, dateData, weixinData);
};

var replaceImageSrcToSignupSheet = function (scope, picUrls) {
    if(validateNonEmptyArray(picUrls)) {
        scope.find('.signUpSheet_image').each(function () {
            var img = $(this);
            if(img.attr('src').indexOf('data:image') === 0 && picUrls.length > 0)
                img.attr('src', picUrls.shift());
        });
    }
};

var defaultDatePickerOption = {
    format: 'yyyy/mm/dd',
    language: 'zh-CN',
    autoclose: true
};

var yearDatePickerOption = {
    format: 'yyyy',
    language: 'zh-CN',
    autoclose: true,
    viewMode: 'years',
    minViewMode: 'years'
};

var escapeHtml = function (str) {
    if ((typeof str) !== 'string')
        return '';
    return $('<div />').text(str).html();
};

var getActRecruitmentUrl = function (org, actId) {
    return '/' + org + '/home/recruitment?activity=' + actId;
};

var getActSignupUrl = function (org, actId) {
    return '/' + org + '/home/signup?activity=' + actId;
};

var getOrgUrl = function (org) {
    return '/' + org + '/home';
};

//from: http://stackoverflow.com/questions/11381673/javascript-solution-to-detect-mobile-browser
var isMobile = function () {
    var check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
            check = true
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

var splitString2ArrayBySemicolon = function (str) {
    var ret = [];
    if ((typeof str) === 'string') {
        str.trim().replaceAll('；', ';').split(';').forEach(function (v) {
            v = v.trim();
            if (v.length > 0 && !ret.contains(v))
                ret.push(v);
        });
    }
    return ret;
};

var __touch_singlePoint = false, __touch_trace = null, __last_touchMovePoint = null, __touchStartsOn = null;
$(window).bind('touchstart', function (e) {
    e = e.originalEvent;
    if (e.touches.length > 1) {
        __touch_singlePoint = false;
        __touchStartsOn = __touch_trace = null;
    }
    else {
        __touch_singlePoint = true;
        __touch_trace = [{ 'x': e.touches[0].clientX, 'y': e.touches[0].clientY }];
        __touchStartsOn = new Date();
    }
}).bind('touchmove', function (e) {
    e = e.originalEvent;
    var nodefault = true; //for Android device's bug, stop scrolling to avoid
    if (__last_touchMovePoint) {
        var deltaX = Math.abs(e.touches[0].clientX - __last_touchMovePoint.x);
        var deltaY = Math.abs(e.touches[0].clientY - __last_touchMovePoint.y);
        if (deltaX < deltaY)
            nodefault = false;
    }
    __last_touchMovePoint = { 'x': e.touches[0].clientX, 'y': e.touches[0].clientY };
    if (Array.isArray(__touch_trace)) {
        var lastPoint = __touch_trace[__touch_trace.length - 1];
        if (lastPoint.x !== e.touches[0].clientX || lastPoint.y !== e.touches[0].clientY)
            __touch_trace.push({ 'x': e.touches[0].clientX, 'y': e.touches[0].clientY });
    }
    if (nodefault)
        e.preventDefault();
}).bind('touchend', function (e) {
    if (Array.isArray(__touch_trace)) {
        var climbX = true, dropX = true, lastX = -1;
        __touch_trace.forEach(function (v) {
            if (lastX < 0)
                lastX = v.x;
            else {
                if (v.x > lastX)
                    dropX = false;
                if (v.x < lastX)
                    climbX = false;
                lastX = v.x;
            }
        });
        var cutDuration = __touchStartsOn && ((new Date()).getTime() - __touchStartsOn.getTime()) <= 300 ? true : false;
        var wd = $(window);
        if (cutDuration && climbX && (lastX - __touch_trace[0].x) > (wd.width() / 3))
            wd.trigger('cutright');
        if (cutDuration && dropX && (__touch_trace[0].x - lastX) > (wd.width() / 3))
            wd.trigger('cutleft');
    }
});

var tryParseJson = function (str) {
    var ret = null;
    try {
        ret = JSON.parse(str);
    }
    catch (err) {
        ret = null;
    }
    return ret;
};

var sortByDateAsc = function (v1, v2, prop) {
    return (new Date(v1[prop])).getTime() - (new Date(v2[prop])).getTime();
};

var sortByDateDesc = function (v1, v2, prop) {
    return (new Date(v2[prop])).getTime() - (new Date(v1[prop])).getTime();
};

var generalSummernoteOption = function (height) {
    return {
        'height': height || 500,
        'lang': 'zh-CN',
        'toolbar': [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],// Still buggy
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['height', ['height']],
            ['insert', ['link', 'picture']],
            ['help', ['help']]
        ]
    };
};

var dateEquals = function (date1, date2) {
    date1 = new Date(date1);
    date2 = new Date(date2);
    var time1 = date1.getTime();
    var time2 = date2.getTime();
    return !isNaN(time1) && !isNaN(time2) && time1 == time2;
};

var genereateLoadingDiv = function (msg) {
    return $('<div />').append($('<img />').attr('src', '/content/image/loading.gif')).append($('<text />').text(msg ? msg : '正在努力加载 :)').addClass('fontBold marginL5px'))
};

var genereateMsgWithCheck = function (msg) {
    return $('<label />').append($('<i />').addClass('fa fa-check')).append($('<text />').text(msg).addClass('marginL5px')).css('color', 'yellowgreen');
};

var genereateMsgWithCross = function (msg) {
    return $('<label />').append($('<i />').addClass('fa fa-times')).append($('<text />').text(msg).addClass('marginL5px')).css('color', 'orange');
};

var generateLabelForUserAutoComplete = function (user) {
    var lb = [];
    lb.push(((typeof user.name) === 'string' && user.name.length > 0) ? user.name : '匿名');
    if((typeof user.nickName) === 'string' && user.nickName.length > 0 ) lb.push(user.nickName);
    lb.push(user.email);
    return lb.join(' | ');
};
