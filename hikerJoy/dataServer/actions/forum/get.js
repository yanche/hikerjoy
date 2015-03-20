
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var objectId = require('mongodb').ObjectID;
var Q = require('q');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;
var utility = require('utility');

//input: { 'orgAlias':, 'label':, 'actId':, 'page':, 'pageSize':, 'emphasis': }
//output: { 'list': [], 'total':, 'nickNames': [ {'_id':, 'nickName': } ], 'orgNames': [ {'_id':, 'shortName':, 'alias': } ], 'actNames': [ {'_id':,'name':} ], 'nav': {}, 'actStatusId': }
var getForumPostList = function (pack) {
    var body = pack.req.body;
    var orgAlias = body.orgAlias, label = body.label, actId = body.actId, page = body.page, pageSize = body.pageSize, emphasis = body.emphasis, defer = new Q.defer();
    page = Number(page), pageSize = Number(pageSize);
    page = isNaN(page) ? 1 : page;
    pageSize = isNaN(pageSize) ? hikerJoy.config.defaultForumPostPageSize : pageSize;
    pageSize = pageSize < hikerJoy.config.minForumPostPageSize ? hikerJoy.config.minForumPostPageSize : pageSize;
    pageSize = pageSize > hikerJoy.config.maxForumPostPageSize ? hikerJoy.config.maxForumPostPageSize : pageSize;
    label = hikerJoy.validate.validateForumPostLabel(label) ? label : null;

    var fields = { '_id': 1, 'title': 1, 'orgId': 1, 'actId': 1, 'createdOn': 1, 'createdByUserId': 1, 'label': 1, 'tags': 1, 'lastModifiedByUserId': 1, 'lastModifiedOn': 1, 'emphasis': 1, 'preview': 1 };
    var ret_posts = null, ret_count = 0, actObjId = actId ? utility.tryConvert2ObjId(actId) : null, nav = label ? { 'label': hikerJoy.constants.translateForumPostLabel(label) } : {}, actStatusId = null;
    if (actId && !actObjId)
        return attachToPack(pack, { 'list': [] });
    nav.emphasis = Boolean(emphasis);
    var qry = label ? { 'label': label } : {};
    dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1, 'shortName': 1, 'alias': 1 })
    .then(function (org) {
        if (hikerJoy.validate.validateValuedString(orgAlias) && !org)
            throw expectedError('org with alias not found: ' + orgAlias); //orgAlias assigned but not found

        if (org) {
            qry['orgId'] = org._id;
            nav.org = { '_id': org._id, 'shortName': org.shortName, 'alias': org.alias };
        }
        if (actObjId) qry['actId'] = actObjId;
        if (emphasis) qry['emphasis'] = true;
        var defers = [
            dataBase.getActiveForumPostsFieldsBy({ '$query': qry, '$orderby': { 'lastModifiedOn': -1 } }, fields, (page - 1) * pageSize, pageSize),
            dataBase.getActiveForumPostsCount(org ? org._id : null, actObjId, label)
        ];
        if (actObjId) {
            var qryAct = { '_id': actObjId, 'statusId': { '$ne': hikerJoy.constants.activityStatus.removed } };
            if (org) qryAct['orgId'] = org._id;
            defers.push(dataBase.getOneActFieldsBy(qryAct, { '_id': 1, 'name': 1, 'statusId': 1 }));
        }
        return Q.all(defers);
    })
    .then(function (data) {
        ret_posts = data[0], ret_count = data[1];
        if (data[2]) {
            nav.act = { '_id': data[2]._id, 'name': data[2].name };
            actStatusId = data[2].statusId;
        }

        if (Array.isArray(ret_posts) && ret_posts.length > 0) {
            var orgIds = [], authorIds = [], actIds = [], subPromiseArr = [];
            ret_posts.forEach(function (v) {
                orgIds.push(v.orgId); authorIds.push(v.createdByUserId); authorIds.push(v.lastModifiedByUserId); actIds.push(v.actId);
                var deferPrmCount = new Q.defer();
                dataBase.getActiveForumPostPrmsCount(v._id)
                .then(function (count) {
                    v.sub = count;
                    deferPrmCount.resolve();
                })
                .fail(function (err) {
                    deferPrmCount.reject(err);
                })
                subPromiseArr.push(deferPrmCount.promise);
            });
            return Q.all([_deferGetUserNicknames(authorIds), _deferGetOrgNames(orgIds), _deferGetActNames(actIds), Q.all(subPromiseArr)]);
        }
        else
            return [[], [], []];
    })
    .then(function (data) {
        defer.resolve(attachToPack(pack, { 'list': ret_posts, 'total': ret_count, 'nickNames': data[0], 'orgNames': data[1], 'actNames': data[2], 'nav': nav, 'actStatusId': actStatusId }));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, { 'list': [] }));
    });
    return defer.promise;
};

//input: {'postId':, 'page':, 'pageSize':, 'orgAlias': }
//output: {list': [ { primary } ], 'total':, 'nickNames': [ {'_id':, 'nickName': } ] }
var getForumPostPrms = function (pack) {
    var body = pack.req.body, emptyRet = { 'list': [] };
    var postId = body.postId, page = body.page, pageSize = body.pageSize, orgAlias = body.orgAlias;
    if (!postId)
        return attachToPack(pack, emptyRet);
    page = Number(page), pageSize = Number(pageSize);
    page = isNaN(page) ? 1 : page;
    pageSize = isNaN(pageSize) ? hikerJoy.config.defaultForumPostPrmPageSize : pageSize;
    pageSize = pageSize < hikerJoy.config.minForumPostPrmPageSize ? hikerJoy.config.minForumPostPrmPageSize : pageSize;
    pageSize = pageSize > hikerJoy.config.maxForumPostPrmPageSize ? hikerJoy.config.maxForumPostPrmPageSize : pageSize;

    var defer = new Q.defer(), fields = { '_id': 1, 'type': 1, 'vote': 1, 'content': 1, 'createdOn': 1, 'createdByUserId': 1, 'lastModifiedOn': 1, 'lastModifiedByUserId': 1 };
    var retPostPrms = null, retCount;

    if (hikerJoy.validate.validateValuedString(orgAlias))
        var orgScope = dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 });
    else {
        var nodefer = new Q.defer();
        nodefer.resolve();
        var orgScope = nodefer.promise;
    }

    orgScope.then(function (org) {
        if (hikerJoy.validate.validateValuedString(orgAlias) && !org)
            throw expectedError('org with alias not found: ' + orgAlias);
        else {
            var qry = { '_id': new objectId(postId) };
            if (org) qry.orgId = org._id;
            return dataBase.getOneActiveForumPostFieldsBy(qry, { '_id': 1 }); //if you input with a wrong org-post mapping, you won't find it.
        }
    })
    .then(function (post) {
        if (post) {
            return Q.all([
                dataBase.getActiveForumPostPrmsFieldsBy({ '$query': { 'postId': post._id }, '$orderby': { 'createdOn': 1 } }, fields, (page - 1) * pageSize, pageSize),
                dataBase.getActiveForumPostPrmsCount(post._id)
            ])
        }
        else
            throw expectedError('post not found: ' + postId + ', orgAlias:' + orgAlias);
    })
    .then(function (data) {
        retPostPrms = data[0], retCount = data[1];
        if (Array.isArray(retPostPrms) && retPostPrms.length > 0) {
            var authorIds = [], subPromiseArr = [];
            retPostPrms.forEach(function (v) {
                authorIds.push(v.createdByUserId); authorIds.push(v.lastModifiedByUserId);
                var deferPrmCount = new Q.defer();
                dataBase.getActiveForumPostSecsCount(v._id)
                .then(function (count) {
                    v.sub = count;
                    deferPrmCount.resolve();
                })
                .fail(function (err) {
                    deferPrmCount.reject(err);
                })
                subPromiseArr.push(deferPrmCount.promise);
            });
            return Q.all([_deferGetUserNicknames(authorIds), Q.all(subPromiseArr)]);
        }
        else
            throw expectedError('no postprms found for postId: ' + postId);
    })
    .then(function (data) {
        defer.resolve(attachToPack(pack, { 'list': retPostPrms, 'total': retCount, 'nickNames': data[0] }));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        return attachToPack(pack, emptyRet);
    });
    return defer.promise;
};

//input: {'postPrmId': }
//output: {list': [ { secondary } ], 'nickNames': [ {'_id':, 'nickName': } ] }
var getForumPostSecs = function (pack) {
    var body = pack.req.body, emptyRet = { 'list': [] };
    var postPrmId = body.postPrmId;
    if (!postPrmId)
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer(), fields = { '_id': 1, 'content': 1, 'createdOn': 1, 'createdByUserId': 1, 'replyToUserId': 1 };
    var retPostSecs = null;
    dataBase.getActiveForumPostSecsFieldsBy({ '$query': { 'postPrmId': new objectId(postPrmId) }, '$orderby': { 'createdOn': 1 } }, fields)
    .then(function (postsecs) {
        if (Array.isArray(postsecs) && postsecs.length > 0) {
            retPostSecs = postsecs;
            var authorIds = [];
            postsecs.forEach(function (v) { authorIds.push(v.createdByUserId); authorIds.push(v.replyToUserId); });
            return _deferGetUserNicknames(authorIds);
        }
        else
            throw expectedError('no postsecs found for postPrmId: ' + postPrmId);
    })
    .then(function (nicknames) {
        defer.resolve(attachToPack(pack, { 'list': retPostSecs, 'nickNames': nicknames }));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'tag': }
//output: { acts: [ {'name':, '_id':, 'orgId': } ], posts: [ {'_id':, 'createdByUserId':, 'createdOn':, 'title':, 'actId':, 'orgId': } ], 'orgNames': [ {'_id':, 'shortName':, 'alias': } ], 'nickNames': [ {'_id':, 'nickName': } ] }
var getRelatedEmphasizedForumPostsByActivityTag = function (pack) {
    var tag = pack.req.body.tag, emptyRet = {};
    if(!hikerJoy.validate.validateValuedString(tag))
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer(), orgNames = null, posts = null, retActs = null;
    dataBase.getActsFieldsBy({'tags': tag, 'statusId': {'$ne': hikerJoy.constants.activityStatus.removed} }, {'_id': 1, 'name': 1, 'orgId': 1})
    .then(function (acts) {
        if(Array.isArray(acts) && acts.length > 0) {
            retActs = acts;
            var actsIdList = [];
            var orgIdList = [];
            acts.forEach(function (one) {
                actsIdList.push(one._id); orgIdList.push(one.orgId);
            });
            return Q.all([
                dataBase.getActiveForumPostsFieldsBy({ '$query': {'actId': {'$in': actsIdList}, 'emphasis': true}, '$orderby': { 'createdOn': -1 } }, {'_id': 1, 'createdByUserId': 1, 'createdOn': 1, 'title': 1, 'actId': 1, 'orgId': 1, 'preview': 1}),
                _deferGetOrgNames(orgIdList)
            ]);
        }
        else
            throw expectedError('no acts found by tag: ' + tag);
    })
    .then(function (data) {
        posts = data[0];
        orgNames = data[1];
        if(Array.isArray(posts) && posts.length > 0)
            var userIdList = posts.map(function (p) {return p.createdByUserId; });
        else
            var userIdList = [];
        return _deferGetUserNicknames(userIdList);
    })
    .then(function (nickNames) {
        defer.resolve(attachToPack(pack, {'acts': retActs, 'posts': posts, 'orgNames': orgNames, 'nickNames': nickNames }));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: id or array of id
var _deferGetUserNicknames = function (arrs) {
    if (!Array.isArray(arrs))
        arrs = [arrs];
    var defer = new Q.defer();
    dataBase.getActiveUsersFieldsBy({ '_id': { '$in': arrs } }, { '_id': 1, 'nickName': 1 })
    .then(function (users) {
        if (Array.isArray(users) && users.length > 0)
            defer.resolve(users);
        else
            defer.resolve([]);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

//input: id or array of id
var _deferGetOrgNames = function (arrs) {
    if (!Array.isArray(arrs))
        arrs = [arrs];
    var defer = new Q.defer();
    dataBase.getActiveOrgsFieldsBy({ '_id': { '$in': arrs } }, { '_id': 1, 'shortName': 1, 'alias': 1 })
    .then(function (orgs) {
        if (Array.isArray(orgs) && orgs.length > 0)
            defer.resolve(orgs);
        else
            defer.resolve([]);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

//input: id or array of id
var _deferGetActNames = function (arrs) {
    if (!Array.isArray(arrs))
        arrs = [arrs];
    var defer = new Q.defer();
    dataBase.getActsFieldsBy({ '_id': { '$in': arrs } }, { '_id': 1, 'name': 1 })
    .then(function (acts) {
        if (Array.isArray(acts) && acts.length > 0)
            defer.resolve(acts);
        else
            defer.resolve([]);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

exports.getForumPostList = getForumPostList;
exports.getForumPostPrms = getForumPostPrms;
exports.getForumPostSecs = getForumPostSecs;
exports.getRelatedEmphasizedForumPostsByActivityTag = getRelatedEmphasizedForumPostsByActivityTag;
