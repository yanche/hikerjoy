$('.forum_index_newPostShow').hide();

var nickNameMap = null, orgNameMap = null, actNameMap = null, currentOrgAlias = getCurrentPageOrg(), querySet = getQueryString();
var page = Number(querySet.page) || 1, pageSize = getForumPostPageSize(querySet); //getForumPostPageSize from hikerJoy_lib_forum.js

if (!querySet.emphasis)
    $('#forum_index_goemphasis').attr('href', getForumIndexLink(currentOrgAlias, querySet.activity, querySet.label, null, null, true));
else {
    $('#forum_index_goemphasis').attr('href', getForumIndexLink(currentOrgAlias, querySet.activity, querySet.label)).text('所有话题');
    $('#forum_index_goemphasis_icon').css('color', 'black');
}

if (querySet.activity) {
    $('#forum_index_gorecruitment').attr('href', getActRecruitmentUrl(currentOrgAlias, querySet.activity));
    $('#forum_index_gosignup').attr('href', getActSignupUrl(currentOrgAlias, querySet.activity));
}
else {
    $('#forum_index_gorecruitment').parent('span').remove();
    $('#forum_index_gosignup').parent('span').remove();
}

//forumPostLabels comes from hikerJoy_lib.js
forumPostLabels.forEach(function (v) {
    $('#forum_index_newPostLabel').append($('<option />').attr('value', v.code).text(v.name));
});

$('#forum_index_newPostLabel').bind('change', function () {
    if(isForumPostLabel4Vote($(this).val())) {
        $('.forum_index_voteOnly').show();
        $('.forum_index_articleOnly').hide();
    }
    else {
        $('.forum_index_voteOnly').hide();
        $('.forum_index_articleOnly').show();
    }
}).trigger('change');

$('#forum_index_newVoteOptionsInput').bind('focusout', function () {
    var obj = $(this);
    var arr = splitString2ArrayBySemicolon(obj.val());
    rmvError(obj.parent('div'));
    appendVoteOptions2Area(arr);
});

var appendVoteOptions2Area = function (list) {
    var currentOptions = retrieveVoteOptions(), container = $('#forum_index_newVoteOptions');
    list.forEach(function (v) {
        if(!currentOptions.contains(v)) {
            var span = $('<span />').addClass('forum_index_newVoteOneOption').text(v).data('option', v);
            span.append($('<i />').addClass('fa fa-times hoverRed pointerCursor marginL5px').bind('click', removeVoteOption));
            container.append(span);
        }
    });
};

var removeVoteOption = function () {$(this).parents('.forum_index_newVoteOneOption').remove()};

var retrieveVoteOptions = function () {
    var ret = [];
    $('#forum_index_newVoteOptions .forum_index_newVoteOneOption').each(function () {
        ret.push($(this).data('option'));
    });
    return ret;
};

var loadingPostIndex = genereateLoadingDiv('帖子们正在努力加载中 ^^ ...');
loadingPostIndex.appendTo($('#forum_index_list'));
corsAjax({
    url: getDataServerRequestUrl('forum', 'getForumPostList'),
    data: { 'orgAlias': currentOrgAlias, 'label': querySet.label, 'actId': querySet.activity, 'page': page, 'pageSize': pageSize, 'emphasis': Boolean(querySet.emphasis) },
    success: function (data) {
        $(function () {
            loadingPostIndex.remove();
            if (data && validateNonEmptyArray(data.list)) {
                renderPostList(data);
                renderForumPostPagination(data.total);
                if (data.actStatusId != 120) $('#forum_index_gosignup').parent('span').remove();
            }
            if (data.nav)
                renderForumIndexNavigation(data.nav);
        });
    }
});

$('#forum_index_newPostSummernote').summernote(generalSummernoteOption());

$('#forum_index_btnCreateNewPost').bind('click', function () {
    $('.forum_index_newPostHide').hide();
    $('.forum_index_newPostShow').show();
});

$('#forum_index_btnCancelNewPost').bind('click', function () {
    $('.forum_index_newPostHide').show();
    $('.forum_index_newPostShow').hide();
});

$('#forum_index_btnSubmitNewPost').bind('click', function () {
    if (validateNewPostData()) {
        var postData = {};
        postData.label = $('#forum_index_newPostLabel').val();
        if(isForumPostLabel4Vote(postData.label)) {
            var desc = $('#forum_index_newVoteDesc').val().trim();
            postData.vote = {'options': retrieveVoteOptions(), 'multi': $('#forum_index_newVoteMulti').val() === 'multi', 'desc': desc };
            postData.preview = desc.length > 197 ? (desc.slice(0, 197) + '...') : desc;
        }
        else {
            var tempDiv = $('<div />').html($('#forum_index_newPostSummernote').code());
            var preview = tempDiv.text().trim();
            postData.content = tempDiv.toHtmlPostModel();
            postData.preview = preview.length > 197 ? (preview.slice(0, 197) + '...') : preview;
        }
        postData.title = $('#forum_index_newPostTitle').val();
        postData.actId = querySet.activity;
        postData.orgAlias = currentOrgAlias;
        var btns = $('#forum_index_btnSubmitNewPost, #forum_index_btnCancelNewPost').attr('disabled', '');
        corsAjax({
            url: getDataServerRequestUrl('forum', 'submitNewForumPost'),
            data: postData,
            success: function (data) {
                btns.removeAttr('disabled');
                if (data) {
                    if (data.returnCode === 0)
                        location.reload();
                    else
                        doAlert({ 'title': '发布帖子失败', 'msg': data.msg, 'style': 'warning' });
                }
            }
        });
    }
});

var validateNewPostData = function () {
    if(validateAll($('#forum_index_newPostSummernote_container'))) {
        var label = $('#forum_index_newPostLabel').val();
        if(isForumPostLabel4Vote(label)) {
            if(retrieveVoteOptions().length === 0) {
                setError($('#forum_index_newVoteOptionsInput').parent('div'));
                return false;
            }
            else
                return true;
        }
        else
            return true;
    }
    else
        return false;
};

var renderPostList = function (data) {
    nickNameMap = convertNickNameArr2Object(data.nickNames);
    orgNameMap = convertOrgNameArr2Object(data.orgNames);
    actNameMap = convertActNameArr2Object(data.actNames);
    var list = $('#forum_index_list');
    data.list.forEach(function (line) {
        list.append(renderPostLineItem(line));
    });
};

var renderPostLineItem = function (line) {
    var emphasis = generatePostLineEmphasisTag(line);
    var orgLink = generatePostLineOrgLink(line);
    var labelLink = generatePostLineLabelLink(line);
    var postLink = generatePostLineLink(line);
    var actLink = generatePostLineActLink(line);
    var helpPanel = $('<span />').addClass('forumPostHelpPanel');
    isCurrentUserGodOrObOrAdminOrOrganizer()
    .then(function (is) {
        if (is) {
            helpPanel.append($('<i />').addClass('fa fa-trash-o pointerCursor hoverRed').bind('click', disactivateForumPost).css('margin-left', '5px'));
            var doemphasis = $('<i />').addClass('fa fa-star pointerCursor hoverYellowgreen').bind('click', emphasizeForumPost).data('emphasis', '0').css('margin-left', '5px');
            if (line.emphasis) doemphasis.css('color', 'yellowgreen').data('emphasis', '1');
            helpPanel.append(doemphasis);
        }
    });
    var nickName = generateAuthorNickName(line);
    var lineFooter = $('<div />').addClass('forumPostIndexPostLineFooter').append(nickName);
    var lineHead = $('<div />').append(emphasis).append(orgLink).append(labelLink).append(actLink).append(postLink).append(helpPanel).addClass('forumPostIndexPostLineHead');
    var lineBody = $('<div />').addClass('forumPostIndexPostLineBody');
    if (line.preview)
        lineBody.append($('<div />').addClass('forumPostPreviewArea pointerCursor').text(line.preview).data('url', getForumPostLink(line._id, line.actId, currentOrgAlias)).bind('click', onClickPostPreviewArea));
    return $('<div />').append(lineHead).append(lineBody).append(lineFooter).addClass('forumPostIndexPostLine col-xs-12').data('postId', line._id);
};

var generatePostLineEmphasisTag = function (line) {
    if (line.emphasis)
        return $('<i />').addClass('fa fa-star').css('color', 'yellowgreen');
    else
        return false;
};

var generatePostLineOrgLink = function (line) {
    if (!currentOrgAlias && line.orgId && orgNameMap[line.orgId]) {
        //getForumIndexLink comes from hikerJoy_lib_forum.js
        var link = $('<a />').attr('href', getForumIndexLink(orgNameMap[line.orgId].alias, querySet.activity, querySet.label)).text('[' + orgNameMap[line.orgId].shortName + ']').addClass('clickable marginLR2px');
        return link;
    }
    else
        return false;
};

var generatePostLineLabelLink = function (line) {
    if (!querySet.label && line.label) {
        //getForumIndexLink comes from hikerJoy_lib_forum.js
        var link = $('<a />').attr('href', getForumIndexLink(currentOrgAlias, querySet.activity, line.label)).text('[' + translateForumPostLabel(line.label).name + ']').addClass('clickable marginLR2px');
        return link;
    }
    else
        return false;
};

var generatePostLineActLink = function (line) {
    if (!querySet.activity && line.actId && actNameMap[line.actId]) {
        //getForumIndexLink comes from hikerJoy_lib_forum.js
        var lineorg = orgNameMap[line.orgId];
        var link = $('<a />').attr('href', getForumIndexLink(currentOrgAlias || lineorg.alias || '', line.actId, querySet.label)).text('[' + actNameMap[line.actId].name + ']').addClass('clickable marginLR2px');
        return link;
    }
    else
        return false;
};

var generatePostLineLink = function (line) {
    //getForumPostLink comes from hikerJoy_lib_forum.js
    var link = $('<a />').attr('href', getForumPostLink(line._id, line.actId, currentOrgAlias)).text(line.title).addClass('clickable marginLR2px');
    return link;
};

var generateAuthorNickName = function (line) {
    var container = $('<span />');
    isCurrentUserLogin()
    .then(function (login) {
        var nickname = nickNameMap[line.createdByUserId];
        var link = $('<span />').text(nickname).addClass('marginLR2px');
        if (login)
            link.addClass('clickable').bind('click', onClickAuthorNickName).data('nickname', nickname);
        var span = $('<span />').text(' @ ' + (new Date(line.createdOn)).format('yyyy-MM-dd hh:mm:ss'));
        container.append(link).append(span);
    });
    return container;
};

var renderForumPostPagination = function (total) {
    var totalPages = Math.floor(((total - 1) / pageSize)) + 1;
    if (totalPages > 1 && page <= totalPages) {
        var pagination = $('<ul />').addClass('pagination');
        var first = $('<li />').append($('<a />').attr('href', getForumIndexLink(currentOrgAlias, querySet.activity, querySet.label, 1, pageSize)).html('&laquo;'));
        pagination.append(first);
        //getPaginationArray from hikerJoy_lib_forum.js
        var pageArray = getPaginationArray(page, totalPages);
        pageArray.forEach(function (i) {
            var li = $('<li />');
            var link = $('<a />').text(i);
            if (i != page) li.append(link.attr('href', getForumIndexLink(currentOrgAlias, querySet.activity, querySet.label, i, pageSize)));
            else li.append(link).addClass('active');
            li.appendTo(pagination);
        });
        var last = $('<li />').append($('<a />').attr('href', getForumIndexLink(currentOrgAlias, querySet.activity, querySet.label, totalPages, pageSize)).html('&raquo;'));
        pagination.append(last);
        pagination.appendTo($('#forum_index_pagination'));
    }
};

var disactivateForumPost = function () {
    var obj = $(this);
    var postId = obj.parents('.forumPostIndexPostLine').data('postId');
    disactivatePostAlert()
    .then(function (confirm) {
        if (confirm) {
            corsAjax({
                url: getDataServerRequestUrl('forum', 'disactivateForumPost'),
                data: { 'postId': postId },
                success: function (data) {
                    if (data.returnCode === 0)
                        location.reload();
                    else
                        doAlert({ 'title': '删除帖子失败', 'msg': data.msg, 'style': 'warning' });
                }
            });
        }
    });
};

var disactivatePostAlert = function () {
    var defer = new Q.defer();
    $('#md_disactivatePost_btnDo').unbind('click').bind('click', function () {
        defer.resolve(true);
    });
    $('#md_disactivatePost_btnCancel').unbind('click').bind('click', function () {
        defer.resolve(false);
    });
    $('#md_disactivatePost').modal({ 'backdrop': 'static', 'keyboard': false });
    return defer.promise;
};

var emphasizeForumPost = function () {
    var obj = $(this);
    if (obj.data('emphasis') === '0')
        var action = 'emphasizePost';
    else
        var action = 'fadeoutPost';
    var postId = obj.parents('.forumPostIndexPostLine').data('postId');
    corsAjax({
        url: getDataServerRequestUrl('forum', action),
        data: { 'postId': postId },
        success: function (data) {
            if (data.returnCode === 0)
                location.reload();
            else
                doAlert({ 'title': obj.data('emphasis') === '0' ? '帖子加精失败' : '取消帖子加精失败', 'msg': data.msg, 'style': 'warning' });
        }
    });
};

var renderForumIndexNavigation = function (nav) {
    var container = $('#forum_index_navigation');
    container.append($('<a />').attr('href', getForumIndexLink()).text('话题').addClass('clickable'));
    var orgalias = null, actId = null, label = null;
    if (nav.org) {
        orgalias = nav.org.alias;
        container.append($('<i />').addClass('fa fa-arrow-right').css('margin-left', '5px').css('margin-right', '5px'));
        container.append($('<a />').attr('href', getForumIndexLink(orgalias)).text(nav.org.shortName).addClass('clickable'));
    }
    if (nav.act) {
        actId = nav.act._id;
        container.append($('<i />').addClass('fa fa-arrow-right').css('margin-left', '5px').css('margin-right', '5px'));
        container.append($('<a />').attr('href', getForumIndexLink(orgalias, actId)).text(nav.act.name).addClass('clickable'));
    }
    if (nav.label) {
        label = nav.label.code;
        container.append($('<i />').addClass('fa fa-arrow-right').css('margin-left', '5px').css('margin-right', '5px'));
        container.append($('<a />').attr('href', getForumIndexLink(orgalias, actId, label)).text(nav.label.name).addClass('clickable'));
    }
    if (nav.emphasis) {
        container.append($('<i />').addClass('fa fa-arrow-right').css('margin-left', '5px').css('margin-right', '5px'));
        container.append($('<a />').attr('href', getForumIndexLink(orgalias, actId, label, null, null, true)).text('精华帖').addClass('clickable'));
    }
};

var onClickAuthorNickName = function (e) {
    $('#md_message_sendMsg_to').val($(this).data('nickname'));
    $('#md_message_tabItem_sendMsg').trigger('click');
    $('#md_message').modal('show');
};

var onClickPostPreviewArea = function () {
    var url = $(this).data('url');
    location = url;
};
