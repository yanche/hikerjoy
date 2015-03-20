
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var objectId = require('mongodb').ObjectID;
var Q = require('q');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;
var dsHelper = require('dataServer_helper');
var utility = require('utility');
var authClient = require('hikerJoy_authClient');

var _validateCodeDown = function (last, cdInSeconds) {
    var lastDate = new Date(last);
    if (isNaN(lastDate.getTime()))
        return true;
    else {
        lastDate.setSeconds(lastDate.getSeconds() + cdInSeconds);
        return lastDate < new Date();
    }
};

//create
//input: {'postPrmId':, 'content': string, 'replyToUserId': }
//output: {'returnCode':, 'msg': }
var submitForumPostSec = function (pack) {
    var authInfo = pack.req.session.user;
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostSec_rc.notAuth));
    if (authInfo.special)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostSec_rc.special));

    var content = pack.req.body.content, postPrmObjId = utility.tryConvert2ObjId(pack.req.body.postPrmId), replyToUserObjId = utility.tryConvert2ObjId(pack.req.body.replyToUserId), defer = new Q.defer(), authorObjId = authInfo._id;
    if (!postPrmObjId || !hikerJoy.validate.validateValuedString(content))
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostSec_rc.inputParaError));

    dataBase.getOneActiveForumPostPrmFieldsBy({ '_id': postPrmObjId }, { '_id': 1, 'postId': 1, 'createdByUserId': 1 })
    .then(function (postPrm) {
        if (postPrm)
            return dataBase.getOneActiveForumPostFieldsBy({ '_id': postPrm.postId }, { '_id': 1, 'orgId': 1 });
        else
            throw expectedError(hikerJoy.constants.submitForumPostSec_rc.postPrmNotFound);
    })
    .then(function (post) {
        if (post)
            return authClient.authQuery.canDoForumPost({ 'sid': pack.req.session.sessionId, 'aliasORid': post.orgId });
        else
            throw expectedError(hikerJoy.constants.submitForumPostSec_rc.postNotFound);
    })
    .then(function (canPost) {
        if (canPost && canPost.auth)
            return dataBase.getOneActiveUserFieldsBy({ '_id': authorObjId }, { '_id': 1, 'lastForumPostSecOn': 1, 'nickName': 1 });
        else
            throw expectedError(hikerJoy.constants.submitForumPostSec_rc.shutup);
    })
    .then(function (author) {
        if (author) {
            if (!hikerJoy.validate.validateValuedString(author.nickName))
                throw expectedError(hikerJoy.constants.submitForumPostSec_rc.nickName);
            else if (_validateCodeDown(author.lastForumPostSecOn, hikerJoy.config.forumPostSecColdDownInSeconds)) {
                if(replyToUserObjId)
                    return dataBase.getOneActiveUserFieldsBy({ '_id': replyToUserObjId }, { '_id': 1 });
                else
                    return null;
            }
            else
                throw expectedError(hikerJoy.constants.submitForumPostSec_rc.frequency);
        }
        else
            throw expectedError(hikerJoy.constants.submitForumPostSec_rc.userNotFound);
    })
    .then(function (replyToUser) {
        if(replyToUserObjId && !replyToUser)
            throw expectedError(hikerJoy.constants.submitForumPostSec_rc.replyToUserNotFound);
        else {
            var newSecPost = {
                'statusId': hikerJoy.constants.forumPostSecStatus.active, 'postPrmId': postPrmObjId,
                'content': content, 'createdOn': new Date(), 'createdByUserId': authorObjId, 'replyToUserId': replyToUserObjId
            };
            return dataBase.insertOneForumPostSec(newSecPost);
        }
    })
    .then(function (insertedSec) {
        if (insertedSec) {
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostSec_rc.success)));
            dataBase.updateUsers({ '_id': authorObjId }, { '$set': { 'lastForumPostSecOn': new Date() } });
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostSec_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostSec_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//create or modify
//input: {'postId':, 'content': [], 'postPrmId': create or modify }
//output: {'returnCode':, 'msg':, 'picUrls': []  }
var submitForumPostPrm = function (pack) {
    var authInfo = pack.req.session.user;
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostPrm_rc.notAuth));
    if (authInfo.special)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostPrm_rc.special));

    var content = pack.req.body.content, postPrmId = pack.req.body.postPrmId, postId = pack.req.body.postId, defer = new Q.defer(), authorObjId = authInfo._id;
    var postPrmObjId = utility.tryConvert2ObjId(postPrmId);
    if (!postId || (postPrmId && !postPrmObjId))
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostPrm_rc.inputParaError));

    var postObjId = new objectId(postId), picUrls = null;
    dataBase.getOneActiveForumPostFieldsBy({ '_id': postObjId }, { '_id': 1, 'orgId': 1 })
    .then(function (post) {
        if (post)
            return authClient.authQuery.canDoForumPost({ 'sid': pack.req.session.sessionId, 'aliasORid': post.orgId });
        else
            throw expectedError(hikerJoy.constants.submitForumPostPrm_rc.postNotFound);
    })
    .then(function (canPost) {
        if (canPost && canPost.auth)
            return dataBase.getOneActiveUserFieldsBy({ '_id': authorObjId }, { '_id': 1, 'lastForumPostPrmOn': 1, 'nickName': 1 });
        else
            throw expectedError(hikerJoy.constants.submitForumPostPrm_rc.shutup);
    })
    .then(function (author) {
        if (author) {
            if (!hikerJoy.validate.validateValuedString(author.nickName))
                throw expectedError(hikerJoy.constants.submitForumPostPrm_rc.nickName);
            else if (_validateCodeDown(author.lastForumPostPrmOn, hikerJoy.config.forumPostPrmColdDownInSeconds)) {
                if (postPrmObjId)
                    return dataBase.getOneActiveForumPostPrmFieldsBy({ '_id': postPrmObjId, 'createdByUserId': authorObjId }, { '_id': 1, 'type': 1 });
                else
                    return true;
            }
            else
                throw expectedError(hikerJoy.constants.submitForumPostPrm_rc.frequency);
        }
        else
            throw expectedError(hikerJoy.constants.submitForumPostPrm_rc.userNotFound);
    })
    .then(function (postPrmOk) {
        if (postPrmOk) { //upload image
            if (!postPrmObjId || postPrmOk.type === 'article')
                return Q.all(dsHelper.uploadImageForHtmlPost(content) || []);
            else
                throw expectedError(hikerJoy.constants.submitForumPostPrm_rc.notArticle);
        }
        else
            throw expectedError(hikerJoy.constants.submitForumPostPrm_rc.postPrmNotFound);
    })
    .then(function (_picUrls) {
        picUrls = _picUrls;
        if (postPrmObjId)
            return dataBase.updateForumPostPrms({ '_id': postPrmObjId }, { '$set': { 'content': content, 'lastModifiedOn': new Date(), 'lastModifiedByUserId': authorObjId } });
        else {
            var now = new Date();
            var newPostPrm = {
                'statusId': hikerJoy.constants.forumPostPrmStatus.active, 'postId': postObjId, 'type': 'article', 'content': content,
                'createdOn': now, 'lastModifiedOn': now, 'createdByUserId': authorObjId, 'lastModifiedByUserId': authorObjId
            };
            return dataBase.insertOneForumPostPrm(newPostPrm);
        }
    })
    .then(function (upsert) {
        if (upsert) {
            var now = new Date();
            var rc = getRCObj(hikerJoy.constants.submitForumPostPrm_rc.success);
            rc.picUrls = picUrls;
            defer.resolve(attachToPack(pack, rc));
            dataBase.updateUsers({ '_id': authorObjId }, { '$set': { 'lastForumPostPrmOn': now } });
            dataBase.updateForumPosts({ '_id': postObjId }, { '$set': { 'lastModifiedOn': now, 'lastModifiedByUserId': authorObjId } });
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostPrm_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitForumPostPrm_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//create
//input: {'orgAlias':, 'label':, 'tags': [], 'actId':, 'title':, 'content': [], 'preview':, 'vote': {'options': [], 'multi':, 'desc':} }
//output: {'returnCode':, 'msg':, 'picUrls': [] }
var submitNewForumPost = function (pack) {
    var authInfo = pack.req.session.user;
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitNewForumPost_rc.notAuth));
    if (authInfo.special)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitNewForumPost_rc.special));
    var adjRequest = hikerJoy.validate.validateAndAdjustNewForumPostRequest(pack.req.body), picUrls = null;
    if (!adjRequest)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitNewForumPost_rc.inputParaError));
    if (adjRequest.vote && adjRequest.vote.options.length <= 1) // adjRequest.vote.options is array of string
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitNewForumPost_rc.options));

    var defer = new Q.defer(), authorObjId = authInfo._id, activityObjId = null, orgObjId = null, scopeLocator = null;
    if (adjRequest.actId) {
        scopeLocator = dataBase.getOneActFieldsBy({ '_id': new objectId(adjRequest.actId), 'statusId': { '$ne': hikerJoy.constants.activityStatus.removed } }, { '_id': 1, 'orgId': 1 })
        .then(function (activity) {
            if (activity) {
                activityObjId = activity._id;
                orgObjId = activity.orgId;
            }
            else
                throw expectedError(hikerJoy.constants.submitNewForumPost_rc.actNotFound);
        })
    }
    else if (adjRequest.orgAlias) {
        scopeLocator = dataBase.getOneActiveOrgFieldsBy({ 'alias': adjRequest.orgAlias }, { '_id': 1 })
        .then(function (org) {
            if (org)
                orgObjId = org._id;
            else
                throw expectedError(hikerJoy.constants.submitNewForumPost_rc.orgNotFound);
        })
    }
    else {
        var tmpdef = new Q.defer();
        scopeLocator = tmpdef.promise;
        tmpdef.resolve();
    }
    
    scopeLocator.then(function () {
        return authClient.authQuery.canDoForumPost({ 'sid': pack.req.session.sessionId, 'aliasORid': orgObjId ? orgObjId : adjRequest.orgAlias });
    })
    .then(function (canPost) {
        if (canPost && canPost.auth)
            return dataBase.getOneActiveUserFieldsBy({ '_id': authorObjId }, { '_id': 1, 'lastForumPostOn': 1, 'nickName': 1 });
        else
            throw expectedError(hikerJoy.constants.submitNewForumPost_rc.shutup);
    })
    .then(function (author) {
        if (author) {
            if (!hikerJoy.validate.validateValuedString(author.nickName))
                throw expectedError(hikerJoy.constants.submitNewForumPost_rc.nickName);
            else if (_validateCodeDown(author.lastForumPostOn, hikerJoy.config.forumPostColdDownInSeconds)) {
                if (!hikerJoy.constants.isForumPostLabel4Vote(adjRequest.label))
                    return Q.all(dsHelper.uploadImageForHtmlPost(adjRequest.content) || []);
                else
                    return;
            }
            else
                throw expectedError(hikerJoy.constants.submitNewForumPost_rc.frequency);
        }
        else
            throw expectedError(hikerJoy.constants.submitNewForumPost_rc.userNotFound);
    })
    .then(function (_picUrls) {
        picUrls = _picUrls;
        var now = new Date();
        var post = {
            'statusId': hikerJoy.constants.forumPostStatus.active, 'title': adjRequest.title, 'orgId': orgObjId, 'actId': activityObjId, 'createdByUserId': authorObjId,
            'createdOn': now, 'lastModifiedByUserId': authorObjId, 'lastModifiedOn': now, 'label': adjRequest.label, 'tags': adjRequest.tags, 'preview': adjRequest.preview
        };
        return dataBase.insertOneForumPost(post);
    })
    .then(function (createdPost) {
        var now = new Date();
        var prm = {
            'statusId': hikerJoy.constants.forumPostPrmStatus.active, 'postId': createdPost._id, 'content': adjRequest.content,
            'createdByUserId': authorObjId, 'createdOn': now, 'lastModifiedByUserId': authorObjId, 'lastModifiedOn': now
        };
        if (!hikerJoy.constants.isForumPostLabel4Vote(adjRequest.label)) { prm.content = adjRequest.content; prm.type = 'article'; }
        else { prm.vote = adjRequest.vote; prm.type = 'vote'; }
        return dataBase.insertOneForumPostPrm(prm);
    })
    .then(function (createdPostPrm) {
        if (createdPostPrm) {
            var rc = getRCObj(hikerJoy.constants.submitNewForumPost_rc.success);
            rc.picUrls = picUrls;
            defer.resolve(attachToPack(pack, rc));
            dataBase.updateUsers({ '_id': authorObjId }, { '$set': { 'lastForumPostOn': new Date() } });
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitNewForumPost_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitNewForumPost_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postPrmId':, 'option': str or array of string }
//output: {'returnCode':, 'msg': }
var voteForumPostPrm = function (pack) {
    var postPrmObjId = utility.tryConvert2ObjId(pack.req.body.postPrmId), option = pack.req.body.option, authInfo = pack.req.session.user;
    if (!postPrmObjId || (!hikerJoy.validate.validateValuedString(option) && !hikerJoy.validate.validateNonEmptyArray(option)))
        return attachToPack(pack, getRCObj(hikerJoy.constants.voteForumPostPrm_rc.inputParaError));
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.voteForumPostPrm_rc.notAuth));
    if (authInfo.special)
        return attachToPack(pack, getRCObj(hikerJoy.constants.voteForumPostPrm_rc.special));

    var defer = new Q.defer(), authorObjId = authInfo._id, postPrmVote = null;
    dataBase.getOneActiveForumPostPrmFieldsBy({ '_id': postPrmObjId, 'type': 'vote' }, { '_id': 1, 'postId': 1, 'vote': 1 })
    .then(function (postPrm) {
        if (postPrm) {
            postPrmVote = postPrm.vote;
            if (Array.isArray(postPrmVote.votee) && postPrmVote.votee.filter(function (v) { return v.userObjId.equals(authorObjId); }).length > 0)
                throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.voted);
            if (postPrmVote.closedOn && postPrmVote.closedOn <= new Date())
                throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.closed);
            return dataBase.getOneActiveForumPostFieldsBy({ '_id': postPrm.postId }, { '_id': 1, 'orgId': 1 });
        }
        else
            throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.postPrmVoteNotFound);
    })
    .then(function (post) {
        if (post)
            return authClient.authQuery.canDoForumPost({ 'sid': pack.req.session.sessionId, 'aliasORid': post.orgId });
        else
            throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.postNotFound);
    })
    .then(function (canPost) {
        if (canPost && canPost.auth)
            return dataBase.getOneActiveUserFieldsBy({ '_id': authorObjId }, { '_id': 1, 'lastForumPostSecOn': 1, 'nickName': 1 });
        else
            throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.shutup);
    })
    .then(function (author) {
        if (author) {
            if (!hikerJoy.validate.validateValuedString(author.nickName))
                throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.nickName);
            else if (_validateCodeDown(author.lastForumPostSecOn, hikerJoy.config.forumPostSecColdDownInSeconds)) {//same cold down as secondary post
                if (Array.isArray(option)) {
                    option = hikerJoy.validate.adjustTrimedUniqueStringArray(option);
                    if (option.length === 0)
                        throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.inputParaError);
                }
                else option = [option.trim()]; //string

                if (postPrmVote.multi) {
                    var choice = [];
                    option.forEach(function (v) {
                        if (postPrmVote.options.contains(v))
                            choice.push(v);
                    });
                    if (choice.length === 0)
                        throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.option);
                    else
                        var votee = { 'userObjId': authorObjId, 'choice': choice };
                }
                else {
                    if (option.length > 1) //option is an array of string here
                        throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.multi);
                    option = option[0];
                    if (postPrmVote.options.contains(option))
                        var votee = { 'userObjId': authorObjId, 'choice': option };
                    else
                        throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.option);
                }
                return votee;
            }
            else
                throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.frequency);
        }
        else
            throw expectedError(hikerJoy.constants.voteForumPostPrm_rc.userNotFound);
    })
    .then(function (votee) {
        return dataBase.updateForumPostPrms({ '_id': postPrmObjId }, { '$push': { 'vote.votee': votee } });
    })
    .then(function (ct) {
        if (ct) {
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.voteForumPostPrm_rc.success)));
            dataBase.updateUsers({ '_id': authorObjId }, { '$set': { 'lastForumPostSecOn': new Date() } });
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.voteForumPostPrm_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.voteForumPostPrm_rc.unKnownError)));
        }
    });
    return defer.promise;
};

exports.submitForumPostSec = submitForumPostSec;
exports.submitForumPostPrm = submitForumPostPrm;
exports.submitNewForumPost = submitNewForumPost;
exports.voteForumPostPrm = voteForumPostPrm;
