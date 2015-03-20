var currentOrgAlias = getCurrentPageOrg();

corsAjax({
    url: getDataServerRequestUrl('org', 'getOrgWeixinId'),
    data: { 'orgAlias': currentOrgAlias },
    success: function (data) {
        if (data)
            $('#weixin_weixinid').val(data.weixinId).data('original', data.weixinId);
    }
});

corsAjax({
    url: getDataServerRequestUrl('org', 'getOrgWeixinKeywords'),
    data: { 'orgAlias': currentOrgAlias },
    success: function (data) {
        if (data) {
            $('#input_keyword_activities').val(data.activities || '').data('original', data.activities || '').data('key', 'activities').data('msgarea', '#msg_submit_keyword_activities');
            $('#input_keyword_intro').val(data.intro || '').data('original', data.intro || '').data('key', 'intro').data('msgarea', '#msg_submit_keyword_intro');
        }
    }
});

$('#weixin_weixinid').bind('focusout', function () {
    var input = $(this);
    var val = input.val().trim();
    if (val !== input.data('original')) {
        input.attr('disabled', '');
        corsAjax({
            url: getDataServerRequestUrl('org', 'submitOrgWeixinId'),
            data: { 'orgAlias': currentOrgAlias, 'weixinId': val },
            success: function (data) {
                input.removeAttr('disabled');
                if (data) {
                    var msg = data.returnCode === 0 ? genereateMsgWithCheck(data.msg) : genereateMsgWithCross(data.msg);
                    setTimeout(function () { msg.fadeOut(function () {msg.remove()}); }, 2000);
                    msg.hide().appendTo($('#msg_submit_weixinId')).fadeIn(700).addClass('control-label').css('text-align', 'left');
                    if(data.returnCode === 0)
                        input.data('original', val);
                }
            }
        });
    }
});

$('#input_keyword_activities, #input_keyword_intro').bind('focusout', function () {
    var input = $(this);
    var val = input.val().trim();
    if(val !== input.data('original')) {
        input.attr('disabled', '');
        corsAjax({
            url: getDataServerRequestUrl('org', 'submitOrgWeixinKeyword'),
            data: { 'orgAlias': currentOrgAlias, 'key': input.data('key'), 'value': val },
            success: function (data) {
                input.removeAttr('disabled');
                if (data) {
                    var msg = data.returnCode === 0 ? genereateMsgWithCheck(data.msg) : genereateMsgWithCross(data.msg);
                    setTimeout(function () { msg.fadeOut(function () {msg.remove()}); }, 2000);
                    msg.hide().appendTo($(input.data('msgarea'))).fadeIn(700).addClass('control-label').css('text-align', 'left');
                    if(data.returnCode === 0)
                        input.data('original', val);
                }
            }
        });
    }
});

var loadingWeixinReplies = genereateLoadingDiv('正在加载社团的微信回复设置 ^^ ...');
$('#weixin_list').append(loadingWeixinReplies);
corsAjax({
    url: getDataServerRequestUrl('org', 'getOrgWeixinReplies'),
    data: { 'orgAlias': currentOrgAlias },
    success: function (data) {
        loadingWeixinReplies.remove();
        if (data) {
            $('#weixin_list').empty();
            renderWelcome(data.welcome || {});
            renderDefault(data.default || {});
            renderAutoReply(data.auto || []);
        }
    }
});

var renderDefault = function (def) {
    def._id = 'default';
    $('#weixin_list').append(createNewWeixinLine(def));
};

var renderWelcome = function (wel) {
    wel._id = 'welcome';
    $('#weixin_list').append(createNewWeixinLine(wel));
};

var renderAutoReply = function (arr) {
    if (validateNonEmptyArray(arr)) {
        var container = $('#weixin_list');
        arr.forEach(function (v) {
            container.append(createNewWeixinLine(v));
        });
    }
};

var createNewWeixinLine = function (weixinBody) {
    var panel = $('<div />').addClass('panel panel-default').data('replyId', weixinBody._id);
    var panel_title = $('<h4 />').addClass('panel-title weixin_reply_title');
    var panel_Head = $('<div />').addClass('panel-heading pointerCursor').css('position', 'relative').append(panel_title);
    if (weixinBody._id !== 'default' && weixinBody._id !== 'welcome') {
        panel_title.text(weixinBody.keywords ? weixinBody.keywords.join('; ') : '暂无关键词');
        var remover = $('<i />').addClass('fa fa-times pointerCursor hoverRed').css('position', 'absolute').css('right', '15px').css('top', '11px');
        panel_Head.append(remover);
        remover.bind('click', weixinLineRemoveClick);
    }
    else if (weixinBody._id === 'default')
        panel_Head.text('默认回复');
    else
        panel_Head.text('欢迎消息');
    var body = $('<div />').addClass('panel-body').append(createWeixinDetailForm(weixinBody));
    var submitBtn = $('<button />').addClass('btn btn-success weixin_submit margin15px').text('提交').bind('click', submitWeixinReplyClick);
    var panel_Body = $('<div />').addClass('panel-collapse').append(body).append(submitBtn).hide();
    panel.append(panel_Head).append(panel_Body);
    panel_Head.bind('click', weixinLineHeadClick);
    return panel;
};

var weixinLineHeadClick = function (e) {
    e.stopPropagation();
    $(this).siblings('.panel-collapse').slideToggle();
};

var weixinLineRemoveClick = function (e) {
    e.stopPropagation();
    var obj = $(this);
    var replyId = obj.parents('.panel').data('replyId');
    if (!replyId)
        obj.parents('.panel').remove();
    else {
        corsAjax({
            url: getDataServerRequestUrl('org', 'archiveOrgWeixinReply'),
            data: { 'orgAlias': currentOrgAlias, 'replyId': replyId },
            success: function (data) {
                if (data.returnCode === 0)
                    obj.parents('.panel').remove();
                else
                    doAlert({ 'title': '删除微信自动回复失败', 'msg': data.msg, 'style': 'warning' });
            }
        });
    }
};

var createWeixinDetailForm = function (weixinBody) {
    var container = $('<div />');
    var form = $('<form />').addClass('form-horizontal');

    var form_keyword_label = $('<label />').addClass('col-sm-3 control-label').text('关键词（；分隔）');
    var form_keyword_value = $('<input />').addClass('form-control weixin_line_keyword').attr('type', 'text').val(weixinBody.keywords ? weixinBody.keywords.join('; ') : '').bind('focusout', weixinReplyKeyWordChange);
    if (weixinBody._id !== 'default' && weixinBody._id !== 'welcome')
        form.append($('<div />').addClass('form-group').append(form_keyword_label).append($('<div />').addClass('col-sm-7').append(form_keyword_value)));

    var form_type_label = $('<label />').addClass('col-sm-3 control-label').text('回复类型');
    var form_type_option_text = $('<option />').attr('value', 'text').text('文本');
    var form_type_option_news = $('<option />').attr('value', 'news').text('多图文（由于微信的限制，请最多设置10条图文回复）');
    if (weixinBody.type === 'text')
        form_type_option_text.attr('selected', '');
    else if (weixinBody.type === 'news')
        form_type_option_news.attr('selected', '');
    var form_type_value = $('<select />').addClass('form-control weixin_line_typeSelector').append(form_type_option_text).append(form_type_option_news).bind('change', changeWeixinReplyType);
    form.append($('<div />').addClass('form-group').append(form_type_label).append($('<div />').addClass('col-sm-7').append(form_type_value)));

    var form_content_label = $('<label />').addClass('col-sm-3 control-label').text('文本');
    var form_content_value = $('<textarea />').addClass('form-control weixin_line_text').css('height', '100px').attr('validate', 'valuedString').val(weixinBody.content ? weixinBody.content : '');
    form.append($('<div />').addClass('form-group weixin_lineType_text').append(form_content_label).append($('<div />').addClass('col-sm-7').append(form_content_value)));

    var newsArea = createWeixinDetailForm_news(weixinBody.news);

    if (weixinBody.type === 'news')
        form.find('.weixin_lineType_text').hide();
    else
        newsArea.hide();

    container.append(form).append(newsArea);
    return container;
};

var createWeixinDetailForm_news = function (newsArr) {
    var container = $('<div />').addClass('weixin_lineType_news col-sm-8 col-sm-offset-2');
    if (validateNonEmptyArray(newsArr)) {
        newsArr.forEach(function (v) {
            container.append(createWeixinDetailForm_oneNewsLine(v));
        });
    }
    else
        container.append(createWeixinDetailForm_oneNewsLine()); //empty panel
    var moreNewsLine = $('<div />').text('添加图文条目').css('text-align', 'center').addClass('dashedRadius5pxBorder padding10px pointerCursor hoverBgGreen');
    moreNewsLine.bind('click', function () { moreNewsLine.before(createWeixinDetailForm_oneNewsLine()); });
    container.append(moreNewsLine);
    return container;
};

var createWeixinDetailForm_oneNewsLine = function (news) {
    var panel = $('<div />').addClass('panel panel-default');
    var panel_title = $('<h4 />').addClass('panel-title');
    var panel_Head = $('<div />').addClass('panel-heading pointerCursor').css('position', 'relative').append(panel_title);
    if (news && (typeof news.title) === 'string' && news.title.trim().length > 0)
        panel_title.text(news.title.trim());
    else
        panel_title.text('暂无标题');

    var remover = $('<i />').addClass('fa fa-times pointerCursor hoverRed').css('position', 'absolute').css('right', '15px').css('top', '11px');
    panel_Head.append(remover);
    remover.bind('click', function () { panel.remove(); });

    var form = $('<form />').addClass('form-horizontal weixin_newsline_form');
    var form_title_label = $('<label />').addClass('col-sm-3 control-label').text('标题');
    var form_title_value = $('<input />').addClass('form-control weixin_line_title').attr('type', 'text').attr('validate', 'valuedString').val((news && news.title) ? news.title : '');
    form_title_value.bind('focusout', function () {
        var val = $(this).val();
        if (val.trim().length > 0)
            panel_title.text(val.trim());
        else
            panel_title.text('暂无标题');
    });
    form.append($('<div />').addClass('form-group').append(form_title_label).append($('<div />').addClass('col-sm-8').append(form_title_value)));

    var form_desc_label = $('<label />').addClass('col-sm-3 control-label').text('简介');
    var form_desc_value = $('<input />').addClass('form-control weixin_line_desc').attr('type', 'text').val((news && news.desc) ? news.desc : '');
    form.append($('<div />').addClass('form-group').append(form_desc_label).append($('<div />').addClass('col-sm-8').append(form_desc_value)));

    var form_url_label = $('<label />').addClass('col-sm-3 control-label').text('链接');
    var form_url_value = $('<input />').addClass('form-control weixin_line_url').attr('type', 'text').val((news && news.url) ? news.url : '');
    form.append($('<div />').addClass('form-group').append(form_url_label).append($('<div />').addClass('col-sm-8').append(form_url_value)));

    var picDiv = createWeixinDetailForm_Pic(news && news.picUrl ? news.picUrl : '');
    form.append(picDiv);

    var body = $('<div />').addClass('panel-body').append(form);
    var panel_Body = $('<div />').addClass('panel-collapse weixin_newsline_panelBody').append(body).hide();
    panel.append(panel_Head).append(panel_Body);
    panel_Head.bind('click', weixinLineHeadClick);
    return panel;
};

var createWeixinDetailForm_Pic = function (picUrl) {
    var row = $('<div />').addClass('form-group');
    var fileBtn = $('<input />').attr('type', 'file');
    var btn = $('<span />').addClass('btn btn-default fileinput-button').append($('<i/>').addClass('fa fa-plus')).append($('<span />').text(' 图片')).append(fileBtn);
    var label = $('<label></label>').addClass('col-sm-3 control-label').append(btn);
    var review = $('<img />').attr('src', picUrl ? picUrl : '/content/image/weixin_autoreply_defaultPic.jpg').addClass('img-responsive weixin_line_pic').css('width', '100%');
    bindEvent2ImageBtnAndReviewer(fileBtn, review);
    var content = $('<div />').addClass('col-sm-8').append(review);
    row.append(label).append(content);
    return row;
};

var changeWeixinReplyType = function () {
    var obj = $(this);
    obj.parents('.panel').find('.weixin_lineType_news, .weixin_lineType_text').hide();
    if (obj.val() === 'text')
        obj.parents('.panel').find('.weixin_lineType_text').show();
    else
        obj.parents('.panel').find('.weixin_lineType_news').show();
};

var weixinReplyKeyWordChange = function () {
    var obj = $(this);
    var arr = splitString2ArrayBySemicolon(obj.val());
    if (validateNonEmptyArray(arr)) {
        rmvError(obj.parent('div'));
        obj.parents('.panel').find('.weixin_reply_title').text(arr.join('; '));
    }
    else {
        setError(obj.parent('div'));
        obj.parents('.panel').find('.weixin_reply_title').text('暂无关键词');
    }
};

var submitWeixinReplyClick = function () {
    var btn = $(this);
    var scope = btn.siblings('.panel-body');
    var replyId = btn.parents('.panel').data('replyId');
    var weixindata = validateAndGetData(scope, replyId === 'default' || replyId === 'welcome');
    if (weixindata) { //do submit
        btn.attr('disabled', '');
        corsAjax({
            url: getDataServerRequestUrl('org', 'submitOrgWeixinReply'),
            data: { 'orgAlias': currentOrgAlias, 'replyId': replyId, 'weixin': weixindata },
            success: function (data) {
                btn.removeAttr('disabled');
                doAlert({ 'title': data.returnCode === 0 ? '提交成功' : '提交失败', 'msg': data.msg, 'style': data.returnCode === 0 ? 'success' : 'warning' });
                if (data.returnCode === 0) {
                    btn.parents('.panel').data('replyId', data.replyId);
                    if(validateNonEmptyArray(data.picUrls)) {
                        btn.parents('.panel').find('.weixin_lineType_news img').each(function () {
                            var img = $(this);
                            if(img.attr('src').indexOf('data:image') === 0 && data.picUrls.length > 0)
                                img.attr('src', data.picUrls.shift());
                        });
                    }
                }
            }
        });
    }
};

var validateAndGetData = function (scope, nokeywords) {
    rmvError(scope.find('div'));
    var valid = true, ret = {};
    if (!nokeywords) {
        var keywordInput = scope.find('.weixin_line_keyword');
        var keywords = splitString2ArrayBySemicolon(keywordInput.val());
        if (!Array.isArray(keywords) || keywords.length === 0) {
            setError(keywordInput.parent('div'));
            valid = false;
        }
        ret.keywords = keywords;
    }
    var type = scope.find('.weixin_line_typeSelector').val();
    if (type === 'text') {
        ret.type = 'text';
        var contentObj = scope.find('.weixin_line_text');
        //validateValuedString comes from hikerJoy_validate.js
        if (!validateValuedString(contentObj.val())) {
            setError(contentObj.parent('div'));
            valid = false;
        }
        ret.content = contentObj.val();
    }
    else if (type === 'news') {
        ret.type = 'news';
        ret.news = [];
        scope.find('.weixin_newsline_form').each(function () {
            var form = $(this);
            var titleObj = form.find('.weixin_line_title');
            //validateValuedString comes from hikerJoy_validate.js
            if (!validateValuedString(titleObj.val())) {
                setError(titleObj.parent('div'));
                valid = false;
                form.parents('.weixin_newsline_panelBody:hidden').slideDown();
            }
            var title = titleObj.val();
            var desc = form.find('.weixin_line_desc').val();
            var picUrl = form.find('.weixin_line_pic').attr('src');
            var url = form.find('.weixin_line_url').val();
            ret.news.push({ 'title': title, 'desc': desc, 'picUrl': picUrl, 'url': url });
        });
        if (ret.news.length === 0) {
            doAlert({ 'title': '提交失败', 'msg': '请至少为多图文消息指定一条图文', 'style': 'warning' });
            return false;
        }
    }
    else { //option value mismatch?
        doAlert({ 'title': '提交失败', 'msg': '未知错误，请联系系统管理员', 'style': 'warning' });
        return false;
    }

    if (valid)
        return ret;
    else
        return false;
};

$('#weixin_btnAddLine').bind('click', function () {
    $('#weixin_list').append(createNewWeixinLine({}));
});

$('#btn_weixinDetails_show').bind('click', function () {
    $('#view_weixinDetails').fadeIn(800);
    $('#view_weixinConfigIntro').fadeOut(800);
});

$('#btn_weixinConfigIntro_show').bind('click', function () {
    $('#view_weixinDetails').fadeOut(800);
    $('#view_weixinConfigIntro').fadeIn(800);
});
