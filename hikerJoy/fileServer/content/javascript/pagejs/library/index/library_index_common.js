var loadingTags = genereateLoadingDiv('正在加载活动标签 ^^ ...');
$('#library_index_tagsArea').append(loadingTags);

corsAjax({
    url: getDataServerRequestUrl('activity', 'getAllActivityTags'),
    success: function (data) {
        loadingTags.remove();
        if (validateNonEmptyArray(data))
            renderTags(data);
    }
});

$('#library_index_tagSearch').bind('keyup', function () {
    searchTags($(this).val().trim());
});

var searchTags = function (query) {
    $('#library_index_tagsArea .activityTag').each(function () {
        var tag = $(this), val = tag.data('tag');
        if ((typeof val) === 'string' && val.indexOf(query) >= 0)
            tag.show();
        else
            tag.hide();
    });
};

var renderTags = function (tags) {
    var container = $('#library_index_tagsArea').empty();
    tags.forEach(function (tag) {
        var span = $('<span />').addClass('activityTag pointerCursor').text(tag).data('tag', tag);
        container.append(span);
    });
};

$('#library_index_tagsArea').on('click', '.activityTag', function () {
    var tag = $(this);
    if (!tag.hasClass('activityTagSelected')) {
        $('#library_index_tagsArea .activityTag').removeClass('activityTagSelected');
        tag.addClass('activityTagSelected');
        renderTagRelatedForumPosts(tag.data('tag'));
    }
});

var tagForumPostsMap = {}, nickNameMapping = {}, orgNameMapping = {}, actNameMapping = {};

var renderTagRelatedForumPosts = function (tag) {
    var area = $('#library_index_forumPostArea').empty();
    getForumPostsByTag(tag)
    .then(function (posts) {
        if (Array.isArray(posts) && posts.length > 0) {
            posts.forEach(function (p) {
                area.append(renderPostLine(p));
            });
        }
    })
};

var getForumPostsByTag = function (tag) {
    var defer = new Q.defer();
    if (tagForumPostsMap[tag])
        defer.resolve(tagForumPostsMap[tag]);
    else {
        corsAjax({
            url: getDataServerRequestUrl('forum', 'getRelatedEmphasizedForumPostsByActivityTag'),
            data: { 'tag': tag },
            success: function (data) {
                if (Array.isArray(data.nickNames) && data.nickNames.length > 0)
                    mergeNickNameArr2Object(data.nickNames, nickNameMapping);
                if (Array.isArray(data.orgNames) && data.orgNames.length > 0)
                    mergeOrgNameArr2Object(data.orgNames, orgNameMapping);
                if (Array.isArray(data.acts) && data.acts.length > 0)
                    mergeActNameArr2Object(data.acts, actNameMapping);
                tagForumPostsMap[tag] = data.posts || [];
                defer.resolve(tagForumPostsMap[tag]);
            }
        });
    }
    return defer.promise;
};

var renderPostLine = function (post) {
    var related = getPostRelatedActAndOrg(post);
    if (related.act && related.org) {
        var container = $('<div />').addClass('forumPostIndexPostLine col-xs-12');
        var head = $('<div />').addClass('forumPostIndexPostLineHead');
        var body = $('<div />').addClass('forumPostIndexPostLineBody');
        var footer = $('<div />').addClass('forumPostIndexPostLineFooter');
        //getForumPostLink from hikerJoy_lib_forum.js
        var postLink = $('<a />').attr('href', getForumPostLink(post._id, post.actId, related.org.alias)).addClass('clickable marginLR2px').text(post.title);
        var actLink = $('<a />').attr('href', getForumIndexLink(related.org.alias, post.actId, null, null, null, true)).addClass('clickable marginLR2px').text('[' + related.act.name + ']');
        if (post.preview)
            body.append($('<div />').addClass('forumPostPreviewArea pointerCursor').text(post.preview).data('url', getForumPostLink(post._id, post.actId, related.org.alias)).bind('click', onClickPostPreviewArea));
        var nickName = generateAuthorNickName(post, related.org);
        return container.append(head.append(actLink).append(postLink)).append(body).append(footer.append(nickName));
    }
    else
        return false;
};

var getPostRelatedActAndOrg = function (post) {
    var act = actNameMapping[post.actId];
    var org = orgNameMapping[post.orgId];
    return { 'act': act, 'org': org };
};

var generateAuthorNickName = function (post, org) {
    var container = $('<span />');
    isCurrentUserLogin()
    .then(function (login) {
        var nickname = nickNameMapping[post.createdByUserId];
        var link = $('<span />').text(nickname).addClass('marginLR2px');
        if (login)
            link.addClass('clickable').bind('click', onClickAuthorNickName).data('nickname', nickname);
        var spanCreatedOn = $('<span />').text(' @ ' + (new Date(post.createdOn)).format('yyyy-MM-dd hh:mm:ss'));
        var spanOrg = $('<a />').addClass('clickable').text(org.shortName).css('margin-left', '5px').attr('href', '/' + org.alias);
        container.append(link).append(spanCreatedOn).append(spanOrg);
    });
    return container;
};

var onClickPostPreviewArea = function () {
    var url = $(this).data('url');
    if (url)
        location = url;
};

var onClickAuthorNickName = function () {
    $('#md_message_sendMsg_to').val($(this).data('nickname'));
    $('#md_message_tabItem_sendMsg').trigger('click');
    $('#md_message').modal('show');
};

$('#forum_index_list').on('click', '.forumPostAuthorNickName', function (e) {
    $('#md_message_sendMsg_to').val($(this).data('nickname'));
    $('#md_message_tabItem_sendMsg').trigger('click');
    $('#md_message').modal('show');
});
