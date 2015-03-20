var summernoteOption = generalSummernoteOption(150);

$('#forum_post_summernote').summernote(summernoteOption);

$('#forum_post_summernoteEditPostPrm').summernote(summernoteOption);

$('#forum_post_resetPrm').bind('click', function () {
    $('#forum_post_summernote').code('');
});

$('#forum_post_submitPrm').bind('click', function () {
    var content = $('<div />').html($('#forum_post_summernote').code()).toHtmlPostModel();
    var btns = $('#forum_post_resetPrm, #forum_post_submitPrm').attr('disabled', '');
    corsAjax({
        url: getDataServerRequestUrl('forum', 'submitForumPostPrm'),
        data: { 'postId': postId, 'content': content },
        success: function (data) {
            btns.removeAttr('disabled');
            if (data) {
                if (data.returnCode === 0)
                    location.reload();
                else
                    doAlert({ 'title': '跟帖失败', 'msg': data.msg, 'style': 'warning' });
            }
        }
    });
});

var nickNameMap = null, currentOrgAlias = getCurrentPageOrg(), querySet = getQueryString(), prmSecMap = {};
var postId = querySet.postId, page = Number(querySet.page) || 1, pageSize = getForumPostPrmPageSize(querySet); //getForumPostPrmPageSize from hikerJoy_lib_forum.js

var loadingPost = genereateLoadingDiv('帖子正在努力加载中 ^^ ...');
loadingPost.appendTo($('#forum_post_prmList'));
corsAjax({
    url: getDataServerRequestUrl('forum', 'getForumPostPrms'),
    data: { 'orgAlias': currentOrgAlias, 'postId': querySet.postId, 'page': querySet.page, 'pageSize': querySet.pageSize },
    success: function (data) {
        $(function () {
            loadingPost.remove();
            if (data && Array.isArray(data.list) && data.list.length > 0) {
                renderPostPrmList(data);
                renderPostPrmPagination(data.total);
            }
        });
    }
});

var renderPostPrmList = function (data) {
    nickNameMap = convertNickNameArr2Object(data.nickNames);
    var list = $('#forum_post_prmList');
    data.list.forEach(function (line) {
        list.append(renderPostPrmLineItem(line));
    });
};

var renderPostPrmLineItem = function (line) {
    var container = $('<div />').addClass('forumPostPrmContainer').data('postPrmId', line._id);
    var header = $('<div />').append(generateLineHeaderForPostPrm(line)).addClass('forumPostPrmHeader');
    var content = $('<div />').addClass('forumPostPrmBody htmlPostView');
    var footer = $('<div />').append(generatePostSecCount(line).bind('click', onClickGetPostSec)).addClass('forumPostPrmFooter');
    var helpPanel = $('<span />').addClass('forumPostPrmHelpPanel').css('margin-left', '3px');
    helpPanel.appendTo(footer);

    isCurrentUserGodOrObOrAdminOrOrganizer()
    .then(function (is) { if (is) helpPanel.append($('<i />').addClass('fa fa-trash-o pointerCursor hoverRed').bind('click', disactivateForumPostPrm)); });
    if(line.type !== 'vote') {
        getCurrentUserId()
        .then(function (userId) { if (userId && userId == line.createdByUserId) helpPanel.append($('<i />').addClass('fa fa-edit pointerCursor hoverRed marginL2px').bind('click', editForumPostPrm)); });
    }

    var footerExtended = $('<div />').addClass('formPostPrmLine_footerExtended').hide().css('margin-left', '10px').css('margin-right', '10px');
    var postSecList = $('<div />').addClass('formPostPrmLine_SecListContainer');
    var postSecSubmitArea = renderSecSubmitArea();
    prmSecMap[line._id] = { 'count': line.sub, 'sec': null };

    if(line.type === 'vote') { //vote
        retrieveVoteInfo(line.vote)
        .then(function (vote) {
            if(vote.desc) content.append($('<div />').text(vote.desc).css('margin-bottom', '10px'));
            var form = $('<form />').addClass('form-horizontal forumPrmVoteForm');
            for(var i in vote.options) {
                var ln = $('<div />').addClass('form-group').css('margin-bottom', '10px');
                var rate = vote.total == 0 ? 0 : Math.round( (vote.options[i] / vote.total) * 1000) / 10;
                ln.append($('<div />').addClass('col-xs-2 forumPrmVote_label').text(i).css('text-align', 'right'));
                ln.append($('<div />').addClass('col-xs-1 forumPrmVote_rate').text(vote.options[i]).css('text-align', 'center').css('padding-left', '0px').css('padding-right', '0px'));
                var div = $('<div />').addClass('progress col-xs-7').css('margin-bottom', '0px').css('padding-left', '0px').css('padding-right', '0px');
                var prog = $('<div />').addClass('progress-bar').css('width', rate + '%').text(rate + '%');
                ln.append(div.append(prog));
                var chooseBtn = $('<i />').addClass('fa fa-times pointerCursor').data('option', i);
                if(vote.choice) {
                    chooseBtn.removeClass('pointerCursor');
                    if(vote.choice.contains(i))
                        chooseBtn.removeClass('fa-times').addClass('fa-check').css('color', 'orange');
                }
                else {
                    if(vote.multi)
                        chooseBtn.bind('click', forumPrmVote_multiChoice);
                    else
                        chooseBtn.bind('click', forumPrmVote_singleChoice);
                }
                ln.append($('<div />').append(chooseBtn).addClass('col-xs-2'));
                form.append(ln);
            };
            content.append(form);
            if(!vote.choice)
                content.append($('<button />').addClass('btn btn-xs btn-success').text('投票').bind('click', forumPrmVote_doVote));
        });
    }
    else if (validateNonEmptyArray(line.content)) //article
        content.html(htmlPostArrayToHtml(line.content));
    return container.append(header).append(content).append(footer).append(footerExtended.append(postSecList).append(postSecSubmitArea));
};

var forumPrmVote_multiChoice = function () {
    var obj = $(this);
    if(obj.hasClass('fa-times'))
        obj.removeClass('fa-times').addClass('fa-check').css('color', 'yellowgreen');
    else
        obj.removeClass('fa-check').addClass('fa-times').css('color', 'black');
};

var forumPrmVote_singleChoice = function () {
    var obj = $(this);
    if(obj.hasClass('fa-times')) {
        obj.parents('.forumPrmVoteForm').find('.fa-check').removeClass('fa-check').addClass('fa-times').css('color', 'black');
        obj.removeClass('fa-times').addClass('fa-check').css('color', 'yellowgreen');
    }
};

var forumPrmVote_doVote = function () {
    var options = [];
    var btn = $(this);
    btn.siblings('.forumPrmVoteForm').find('i.fa-check').each(function () {
        options.push($(this).data('option'));
    });
    if(options.length > 0) {
        btn.attr('disabled', '');
        corsAjax({
            url: getDataServerRequestUrl('forum', 'voteForumPostPrm'),
            data: { 'postPrmId': btn.parents('.forumPostPrmContainer').data('postPrmId'), 'option': options },
            success: function (data) {
                btn.removeAttr('disabled');
                if(data) {
                    if(data.returnCode === 0)
                        location.reload();
                    else
                        doAlert({ 'title': '投票失败', 'msg': data.msg, 'style': 'warning' });
                }
            }
        });
    }
};

//{'desc':, 'options':, 'votee':, 'multi': }
var retrieveVoteInfo = function (vote) {
    return getCurrentUserId()
    .then(function (userId) {
        var ret = {'desc': vote.desc, 'multi': vote.multi };
        var options = {}, total = 0, mychoice = null;
        vote.options.forEach(function (v) { options[v] = 0; });
        if(Array.isArray(vote.votee)) {
            vote.votee.forEach(function (v) {
                if(Array.isArray(v.choice))
                    var choice = v.choice;
                else
                    var choice = [v.choice]; //string case
                choice.forEach(function (v) {
                    if(options[v] != undefined) {
                        options[v] += 1;
                        total += 1;
                    }
                });
                if(v.userObjId == userId)
                    mychoice = choice;
            });
        }
        ret.options = options;
        ret.total = total;
        ret.choice = mychoice;
        return ret;
    });
};

var renderSecSubmitArea = function () {
    var container = $('<div />');
    container.append($('<input />').attr('type', 'text').attr('validate', 'valuedString').attr('placeholder', '回复PO主').addClass('form-control postSecInput').css('width', '80%').css('display', 'inline-block'));
    container.append($('<span />').addClass('clickable').text('回复').css('margin-left', '5px').bind('click', submitPostSec).data('disabled', '0'));
    container.append($('<span />').addClass('clickable').text('取消').css('margin-left', '5px').bind('click', cancelSubmitPostSec).data('disabled', '0'));
    return container;
};

var generateAuthorNickName = function (userId) {
    var link = $('<span />');
    isCurrentUserLogin()
    .then(function (login) {
        if (login) {
            var nickname = nickNameMap[userId];
            link.text(nickname).data('nickname', nickname).addClass('forumPostPrmAuthorNickName clickable');
        }
        else
            link.text(nickNameMap[userId]).addClass('forumPostStatic');
    });
    return link;
};

var generateAuthorPostTime = function (createdOn) {
    return $('<span />').text(' @ ' + (new Date(createdOn)).format('yyyy-MM-dd hh:mm:ss')).addClass('forumPostStatic');
};

var generateLineHeaderForPostSec = function (line) {
    var ret = $('<span />');
    ret.append(generateAuthorNickName(line.createdByUserId));
    if (line.replyToUserId) {
        ret.append($('<span />').text(' 回复 ').addClass('forumPostStatic'));
        ret.append(generateAuthorNickName(line.replyToUserId));
    }
    ret.append(generateAuthorPostTime(line.createdOn));
    return ret;
};

var generateLineHeaderForPostPrm = function (line) {
    var ret = $('<span />');
    ret.append(generateAuthorNickName(line.createdByUserId));
    ret.append(generateAuthorPostTime(line.createdOn));
    return ret;
};

var getPostSecCountString = function (count) {
    return ' ' + (count || 0) + '条回复';
};

var generatePostSecCount = function (line) {
    var icon = $('<span />').addClass('fa fa-comment');
    var text = $('<span />').addClass('forumPostPrm_SecAnchor').text(getPostSecCountString(line.sub));
    var link = $('<span />').addClass('clickable').append(icon).append(text);
    return link;
};

var onClickGetPostSec = function () {
    var anchor = $(this);
    var extendedArea = anchor.parents('.forumPostPrmContainer').find('.formPostPrmLine_footerExtended');
    var postPrmId = anchor.parents('.forumPostPrmContainer').data('postPrmId');
    if (extendedArea.is(':visible'))
        anchor.find('.forumPostPrm_SecAnchor').text(getPostSecCountString(prmSecMap[postPrmId].count));
    else
        anchor.find('.forumPostPrm_SecAnchor').text(' 收起回复');
    extendedArea.slideToggle();

    if (!Array.isArray(prmSecMap[postPrmId].sec))
        getPrmLineSecAndRender(extendedArea, postPrmId);
};

var getPrmLineSecAndRender = function (extendedArea, postPrmId) {
    getPrmLineSec(postPrmId)
    .then(function (data) {
        extendedArea.find('.formPostPrmLine_SecListContainer').empty().append(renderPrmLineSec(data));
    });
};

var getPrmLineSec = function (postPrmId) {
    var defer = new Q.defer();
    if (prmSecMap[postPrmId] && Array.isArray(prmSecMap[postPrmId].sec)) {
        defer.resolve(prmSecMap[postPrmId].sec);
    }
    else {
        corsAjax({
            url: getDataServerRequestUrl('forum', 'getForumPostSecs'),
            data: { 'postPrmId': postPrmId },
            success: function (data) {
                if (!data) data = {};
                if (!Array.isArray(data.list)) data.list = [];
                if (!prmSecMap[postPrmId]) prmSecMap[postPrmId] = { 'count': data.list.length };
                prmSecMap[postPrmId].sec = data.list;
                if (Array.isArray(data.nickNames))
                    mergeNickNameArr2Object(data.nickNames, nickNameMap);
                defer.resolve(data.list);
            }
        });
    }
    return defer.promise;
};

var renderPrmLineSec = function (data) {
    //mergeNickNameArr2Object comes from hikerJoy_lib_forum.js
    var container = $('<div />');
    var list = $('<div />').addClass('form_post_sec_ListArea');
    data.forEach(function (line, k) {
        list.append(renderPostSecLine(line));
    });
    var pagination = $('<div />').addClass('form_post_sec_PaginationArea');
    renderPostSecPagination(pagination, 1, data.length);
    hideSecLinesByPage(list.children('.formPostSecContainer'), 1);
    return container.append(list).append(pagination);
};

var renderPostSecLine = function (line) {
    var nickname = nickNameMap[line.createdByUserId];
    var container = $('<div />').addClass('formPostSecContainer').data('postSecId', line._id);
    var header = $('<div />').append(generateLineHeaderForPostSec(line));
    var headerRightPanel = $('<span />').addClass('pull-right');
    headerRightPanel.appendTo(header);
    headerRightPanel.append($('<span />').addClass('clickable').text('回复').bind('click', replyToUser).data('replyToNickName', nickname).data('replyToUserId', line.createdByUserId));
    isCurrentUserGodOrObOrAdminOrOrganizer()
    .then(function (is) {
        if (is)
            headerRightPanel.append($('<span />').css('margin-left', '3px').append($('<i />').addClass('fa fa-trash-o hoverRed pointerCursor').bind('click', disactivateForumPostSec)));
    });
    var content = $('<div />').text(line.content);
    return container.append(header).append(content);
};

var cancelSubmitPostSec = function () {
    if ($(this).data('disabled') == '0')
        rmvError($(this).siblings('.postSecInput').val('').attr('placeholder', '回复PO主').data('replyToUserId', '').parent('div'));
};

var submitPostSec = function () {
    var btn = $(this);
    var input = btn.siblings('.postSecInput');
    var postPrmId = btn.parents('.forumPostPrmContainer').data('postPrmId');
    if (btn.data('disabled') == '0' && validateAll(input.parent('div'))) {
        btn.parent('div').children('.clickable').data('disabled', '1');
        input.attr('disabled', '');
        corsAjax({
            url: getDataServerRequestUrl('forum', 'submitForumPostSec'),
            data: { 'postPrmId': postPrmId, 'content': input.val(), 'replyToUserId': input.data('replyToUserId') ? input.data('replyToUserId') : null },
            success: function (data) {
                btn.parent('div').children('.clickable').data('disabled', '0');
                if (data) {
                    if (data.returnCode !== 0)
                        doAlert({ 'title': '回复失败', 'msg': data.msg, 'style': 'warning' });
                    else {
                        input.removeAttr('disabled').val('');
                        prmSecMap[postPrmId] = null;
                        getPrmLineSecAndRender(btn.parents('.formPostPrmLine_footerExtended'), postPrmId);
                    }
                }
            }
        });
    }
};

var replyToUser = function () {
    var btn = $(this);
    btn.parents('.formPostPrmLine_footerExtended').find('.postSecInput').attr('placeholder', '回复' + btn.data('replyToNickName')).focus().data('replyToUserId', btn.data('replyToUserId'));
};

$('#forum_post_prmList').on('click', '.forumPostPrmAuthorNickName', function (e) {
    $('#md_message_sendMsg_to').val($(this).data('nickname'));
    $('#md_message_tabItem_sendMsg').trigger('click');
    $('#md_message').modal('show');
});


//post prm pagination
var renderPostPrmPagination = function (total) {
    var totalPages = Math.floor(((total - 1) / pageSize)) + 1;
    if (totalPages > 1 && page <= totalPages) {
        var pagination = $('<ul />').addClass('pagination');
        var first = $('<li />').append($('<a />').attr('href', getForumPostLink(postId, querySet.activity, currentOrgAlias, 1, pageSize)).html('&laquo;'));
        pagination.append(first);
        //getPaginationArray from hikerJoy_lib_forum.js
        var pageArray = getPaginationArray(page, totalPages);
        pageArray.forEach(function (i) {
            var li = $('<li />');
            var link = $('<a />').text(i);
            if (i != page) li.append(link.attr('href', getForumPostLink(postId, querySet.activity, currentOrgAlias, i, pageSize)));
            else li.append(link).addClass('active');
            li.appendTo(pagination);
        });
        var last = $('<li />').append($('<a />').attr('href', getForumPostLink(postId, querySet.activity, currentOrgAlias, totalPages, pageSize)).html('&raquo;'));
        pagination.append(last);
        pagination.appendTo($('#forum_post_pagination'));
    }
};

var secPageSize = 5;
var renderPostSecPagination = function (container, page, total) {
    var totalPages = Math.floor(((total - 1) / secPageSize)) + 1;
    if (totalPages > 1 && page <= total) {
        var pagination = $('<ul />').addClass('pagination pagination-sm').data('total', total);
        var first = $('<li />').append($('<a />').html('&laquo;')).bind('click', postSecPaginationClick).data('page', 1);
        pagination.append(first);
        //getPaginationArray from hikerJoy_lib_forum.js
        var pageArray = getPaginationArray(page, totalPages);
        pageArray.forEach(function (i) {
            var li = $('<li />').append($('<a />').text(i)).bind('click', postSecPaginationClick).data('page', i);
            if (i == page) li.addClass('active');
            pagination.append(li);
        });
        var last = $('<li />').append($('<a />').html('&raquo;')).bind('click', postSecPaginationClick).data('page', totalPages);
        pagination.append(last);
        pagination.appendTo(container);
    }
};

var postSecPaginationClick = function (e) {
    e.stopPropagation();
    var btn = $(this);
    if (!btn.hasClass('active')) {
        var goto = Number(btn.data('page'));
        var total = Number(btn.parent('ul').data('total'));
        hideSecLinesByPage(btn.parents('.form_post_sec_PaginationArea').siblings('.form_post_sec_ListArea').children('.formPostSecContainer'), goto);
        renderPostSecPagination(btn.parents('.form_post_sec_PaginationArea').empty(), goto, total);
    }
};

var hideSecLinesByPage = function (lines, page) {
    lines.hide().slice((page - 1) * secPageSize, page * secPageSize).show();
};

//remove
var disactivateForumPostPrm = function () {
    var postPrmId = $(this).parents('.forumPostPrmContainer').data('postPrmId');
    disactivatePostPrmSecAlert()
    .then(function (confirm) {
        if (confirm) {
            corsAjax({
                url: getDataServerRequestUrl('forum', 'disactivateForumPostPrm'),
                data: { 'postPrmId': postPrmId },
                success: function (data) {
                    if (data.returnCode === 0)
                        location.reload();
                    else
                        doAlert({ 'title': '删除跟帖失败', 'msg': data.msg, 'style': 'warning' });
                }
            });
        }
    });
};

var disactivatePostPrmSecAlert = function () {
    var defer = new Q.defer();
    $('#md_disactivatePostPrmSec_btnDo').unbind('click').bind('click', function () {
        defer.resolve(true);
    });
    $('#md_disactivatePostPrmSec_btnCancel').unbind('click').bind('click', function () {
        defer.resolve(false);
    });
    $('#md_disactivatePostPrmSec').modal({ 'backdrop': 'static', 'keyboard': false });
    return defer.promise;
};

var disactivateForumPostSec = function () {
    var obj = $(this);
    var postPrmId = obj.parents('.forumPostPrmContainer').data('postPrmId');
    var postSecId = obj.parents('.forumPostPrmContainer').data('postSecId');
    disactivatePostPrmSecAlert()
    .then(function (confirm) {
        if (confirm) {
            corsAjax({
                url: getDataServerRequestUrl('forum', 'disactivateForumPostSec'),
                data: { 'postSecId': postSecId },
                success: function (data) {
                    if (data.returnCode === 0) {
                        prmSecMap[postPrmId] = null;
                        getPrmLineSecAndRender(obj.parents('.formPostPrmLine_footerExtended'), postPrmId);
                    }
                    else
                        doAlert({ 'title': '删除回复失败', 'msg': data.msg, 'style': 'warning' });
                }
            });
        }
    });
};

var editForumPostPrm = function () {
    var obj = $(this);
    $('#forum_post_newPostPrmArea').hide();
    $('#forum_post_editPostPrmArea').show();
    var postPrmId = obj.parents('.forumPostPrmContainer').data('postPrmId');
    $('#forum_post_submitEditPostPrm').data('postPrmId', postPrmId);
    var content = obj.parents('.forumPostPrmContainer').find('.forumPostPrmBody').html();
    $('#forum_post_summernoteEditPostPrm').code(content)
};

$('#forum_post_cancelEditPostPrm').bind('click', function () {
    $('#forum_post_newPostPrmArea').show();
    $('#forum_post_editPostPrmArea').hide();
    $('#forum_post_submitEditPostPrm').data('postPrmId', '');
});

$('#forum_post_submitEditPostPrm').bind('click', function () {
    var postPrmId = $(this).data('postPrmId');
    if (postPrmId) {
        var btns = $('#forum_post_cancelEditPostPrm, #forum_post_submitEditPostPrm').attr('disabled', '');
        var content = $('<div />').html($('#forum_post_summernoteEditPostPrm').code()).toHtmlPostModel();
        corsAjax({
            url: getDataServerRequestUrl('forum', 'submitForumPostPrm'),
            data: { 'postId': postId, 'content': content, 'postPrmId': postPrmId },
            success: function (data) {
                btns.removeAttr('disabled');
                if (data) {
                    if (data.returnCode === 0) {
                        $(this).data('postPrmId', '');
                        location.reload();
                    }
                    else
                        doAlert({ 'title': '跟帖编辑失败', 'msg': data.msg, 'style': 'warning' });
                }
            }
        });
    }
    else
        doAlert({ 'title': '跟帖编辑失败', 'msg': '抱歉，未找到想要编辑的部分，请先点击目标跟帖的编辑之后再做提交', 'style': 'warning' });
});

$('#forum_post_editPostPrmArea').hide();
