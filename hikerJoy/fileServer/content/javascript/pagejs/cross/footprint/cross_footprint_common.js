var currentOrgAlias = getCurrentPageOrg();
var currentOrgInfo_1 = null;
var currentOrgInfo_multi = null;

var loadingFootprint = genereateLoadingDiv('正在加载你的历史活动记录 ^^ ...');
$('#footprint_main').append(loadingFootprint);

corsAjax({
    url: getDataServerRequestUrl('user', 'getUserFootprint'),
    data: { 'orgAlias': currentOrgAlias },
    success: function (data) {
        loadingFootprint.remove();
        if (data && (validateNonEmptyArray(data.active) || validateNonEmptyArray(data.history))) {
            hikerJoy_context.getOrgContext()
            .then(function (context) {
                if (currentOrgAlias)
                    currentOrgInfo_1 = searchOrgByAlias(context, currentOrgAlias);
                else
                    currentOrgInfo_multi = context;
            })
            .then(function () {
                var __orderBySignupOn = function (act1, act2) {
                    return sortByDateDesc(act1, act2, 'startsOn');
                };
                var hasActive = validateNonEmptyArray(data.active), hasHistory = validateNonEmptyArray(data.history);
                $(function () {
                    if (hasHistory)
                        renderShowHistoryBtn();
                    if (hasActive)
                        renderActiveRecords(data.active.sort(__orderBySignupOn));
                    if (hasHistory)
                        renderHistoryRecords(data.history.sort(__orderBySignupOn));
                });
            });
        }
        else
            renderNoActiveActivity();
    }
});

var renderNoActiveActivity = function () {
    $('#footprint_main').addClass('fontBold').css('font-size', '18px').append($('<span />').text('你还没有参加过活动哦，速速去')).append($('<a />').attr('href', '/global/activities').text('报名').addClass('clickable')).append($('<span />').text('吧！'));
};

var activityStatusMapping = {
    '110': '筹备中',
    '120': '报名中',
    '130': '进行中',
    '140': '已结束',
    '150': '已结束'
};

var memberStatusMapping = {
    '410': '等待',
    '420': '入队',
    '430': '强制退出',
    '440': '退出'
};

var renderActiveRecords = function (acts) {
    var container = $('#footprint_main');
    acts.forEach(function (oneact) {
        container.append(renderOneActiveRecord(oneact));
    });
};

var renderHistoryRecords = function (acts) {
    var container = $('#footprint_main');
    acts.forEach(function (oneact) {
        container.append(renderOneHistoryRecord(oneact));
    });
};

var renderShowHistoryBtn = function () {
    $('#footprint_main').append($('<div />').addClass('col-xs-12 marginB15px clickable').text('显示/隐藏历史活动记录').bind('click', function () {
        $('#footprint_main').find('.historyFootprint').toggle();
    }));
};

var renderSheet = function (sheet, items) {
    var form = $('<form />').addClass('form form-horizontal');
    if (validateNonEmptyArray(sheet)) {
        sheet.forEach(function (v) {
            if (v) {
                var lineItem = renderSheetLine(v, items);
                if (lineItem) {
                    lineItem.addClass('footprint_signupAdditionalInfo');
                    form.append(lineItem);
                }
            }
        });
    }
    return form;
};

var renderSheetLine = function (sheetLine, items) {
    //renderSheetLineItem_mapping comes from hikerJoy_lib.js
    var fn = renderSheetLineItem_mapping[sheetLine.type];
    if (fn) {
        var line = fn(sheetLine);
        if (line) {
            var label = sheetLine.label, type = sheetLine.type;
            var matchItem = __searchItemForSheetLine(items, label, type);
            matchItem && __giveValueToSheetLine(matchItem.value, type, line);
        }
        return line;
    }
    else
        return null;
};

var __giveValueToSheetLine = function (value, type, line) {
    if (type === 'text')
        line.find('input.signUpSheet_text').val(value);
    else if (type === 'textarea')
        line.find('textarea.signUpSheet_textarea').val(value);
    else if (type === 'image')
        line.find('img.signUpSheet_image').attr('src', value);
    else if (type === 'select')
        line.find('select.signUpSheet_select').val(value);
    else if (type === 'multi-select') {
        if (validateNonEmptyArray(value)) {
            line.find('div.signUpSheet_multiSelect .signUpSheetChk').each(function () {
                var obj = $(this);
                if (value.contains(obj.data('value')))
                    obj.data('stage', '1').trigger('refreshDisplay');
                else
                    obj.data('stage', '0').trigger('refreshDisplay');
            });
        }
    }
    else if (type === 'date')
        line.find('input.signUpSheet_date').datepicker('setDate', value);
    else if (type === 'weixin')
        line.find('input.signUpSheet_weixin').val(value);
};

var __searchItemForSheetLine = function (items, label, type) {
    if (validateNonEmptyArray(items)) {
        var match = items.filter(function (v) {
            return v.type === type && v.label === label;
        });
        if (match.length > 0)
            return match[0]; //should be only one!
        else
            return null;
    }
    else
        return null;
};
