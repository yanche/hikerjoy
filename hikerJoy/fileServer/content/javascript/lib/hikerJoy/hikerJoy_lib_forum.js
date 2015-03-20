
var convertNickNameArr2Object = function (arr) {
    var ret = {};
    arr.forEach(function (v) {
        ret[v._id] = v.nickName;
    });
    return ret;
};

var mergeNickNameArr2Object = function (arr, map) {
    arr.forEach(function (v) {
        if(!map[v._id])
            map[v._id] = v.nickName;
    });
};

var convertOrgNameArr2Object = function (arr) {
    var ret = {};
    arr.forEach(function (v) {
        ret[v._id] = {'shortName': v.shortName, 'alias': v.alias};
    });
    return ret;
};

var mergeOrgNameArr2Object = function (arr, map) {
    arr.forEach(function (v) {
        if(!map[v._id])
            map[v._id] = {'shortName': v.shortName, 'alias': v.alias};
    });
};

var convertActNameArr2Object = function (arr) {
    var ret = {};
    arr.forEach(function (v) {
        ret[v._id] = {'name': v.name, 'orgId': v.orgId};
    });
    return ret;
};

var mergeActNameArr2Object = function (arr, map) {
    arr.forEach(function (v) {
        if(!map[v._id])
            map[v._id] = {'name': v.name, 'orgId': v.orgId};
    });
};

var getForumIndexLink = function (orgAlias, actId, label, page, pageSize, emphasis) {
    var ret = location.origin;
    if(orgAlias)
        ret += '/' + orgAlias;
    ret += '/forum/index';
    var args = [];
    if(actId) args.push('activity=' + actId);
    if(label) args.push('label=' + label);
    if(page) args.push('page=' + page);
    if(pageSize) args.push('pageSize=' + pageSize);
    if(emphasis) args.push('emphasis=' + 1);
    if(args.length > 0)
        ret += '?' + args.join('&');
    return ret;
};

var getForumPostLink = function (postId, actId, orgAlias, page, pageSize) {
    var ret = location.origin;
    if(orgAlias)
        ret += '/' + orgAlias;
    ret += '/forum/post';
    var args = [];
    args.push('postId=' + postId);
    if(actId) args.push('activity=' + actId);
    if(page) args.push('page=' + page);
    if(pageSize) args.push('pageSize=' + pageSize);
    ret += '?' + args.join('&');
    return ret;
};

var defaultForumPostPrmPageSize = 10;
var minForumPostPrmPageSize = 5;
var maxForumPostPrmPageSize = 30;

var defaultForumPostPageSize = 30;
var minForumPostPageSize = 15;
var maxForumPostPageSize = 100;

var getForumPostPrmPageSize = function (querySet) {
    if(!querySet)
        return defaultForumPostPrmPageSize;
    else {
        var pageSize = Number(querySet.pageSize) || defaultForumPostPrmPageSize;
        if(pageSize < minForumPostPrmPageSize) pageSize = minForumPostPrmPageSize;
        if(pageSize > maxForumPostPrmPageSize) pageSize = maxForumPostPrmPageSize;
        return pageSize;
    }
};

var getForumPostPageSize = function (querySet) {
    if(!querySet)
        return defaultForumPostPageSize;
    else {
        var pageSize = Number(querySet.pageSize) || defaultForumPostPageSize;
        if(pageSize < minForumPostPageSize) pageSize = minForumPostPageSize;
        if(pageSize > maxForumPostPageSize) pageSize = maxForumPostPageSize;
        return pageSize;
    }
};

//condition: page and totalPages are both integer and 1 <= page <= totalPage
var getPaginationArray = function (page, totalPages) {
    var ret = [];
    if(page <= 3 || totalPages <= 5) {
        for(var i = 1; i <= totalPages && i <= 5; ++i)
            ret.push(i);
    }
    else if(page >= totalPages - 2) {
        for(var i = totalPages - 4; i <= totalPages; ++i)
            ret.push(i);
    }
    else {
        ret.push(page - 2);
        ret.push(page - 1);
        ret.push(page);
        ret.push(page + 1);
        ret.push(page + 2);
    }
    return ret;
};

var forumPostLabels = [
    {'name': '原创(YC)', 'code': 'yc'},
    {'name': '闲话', 'code': 'xh'},
    {'name': '求助', 'code': 'qz'},
    {'name': '攻略', 'code': 'gl'},
    {'name': '建议', 'code': 'jy'},
    {'name': '投票', 'code': 'tp'}
];

var translateForumPostLabel = function (labelCode) {
    var fl = forumPostLabels.filter(function (v) {return v.code === labelCode;});
    if(fl.length > 0)
        return fl[0];
    else
        return false;
};

var isForumPostLabel4Vote = function (label) {
    return label === '投票' || label === 'tp';
};
