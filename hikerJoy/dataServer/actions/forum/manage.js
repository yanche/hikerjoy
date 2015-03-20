
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var objectId = require('mongodb').ObjectID;
var Q = require('q');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;
var utility = require('utility');
var authClient = require('hikerJoy_authClient');

//input: {'postId': }
//output: {'returnCode':, 'msg': }
var disactivateForumPost = function (pack) {
    var postId = pack.req.body.postId, authInfo = pack.req.session.user;
    if(!postId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPost_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPost_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canDisactivateForumPost({'sid': pack.req.session.sessionId, 'postId': postId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostFieldsBy({'_id': new objectId(postId)}, {'_id': 1, 'statusId': 1});
        else
            throw expectedError(hikerJoy.constants.disactivateForumPost_rc.notAuth);
    })
    .then(function (post) {
        if(post) {
            if(post.statusId === hikerJoy.constants.forumPostStatus.active)
                return dataBase.updateForumPosts({'_id': post._id}, {'$set': {'statusId': hikerJoy.constants.forumPostStatus.inactive}});
            else
                throw expectedError(hikerJoy.constants.disactivateForumPost_rc.disactive);
        }
        else
            throw expectedError(hikerJoy.constants.disactivateForumPost_rc.postNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPost_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPost_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPost_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postPrmId': }
//output: {'returnCode':, 'msg': }
var disactivateForumPostPrm = function (pack) {
    var postPrmId = pack.req.body.postPrmId, authInfo = pack.req.session.user;
    if(!postPrmId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostPrm_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostPrm_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canDisactivateForumPostPrm({'sid': pack.req.session.sessionId, 'postPrmId': postPrmId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostPrmFieldsBy({'_id': new objectId(postPrmId)}, {'_id': 1, 'statusId': 1});
        else
            throw expectedError(hikerJoy.constants.disactivateForumPostPrm_rc.notAuth);
    })
    .then(function (postPrm) {
        if(postPrm) {
            if(postPrm.statusId === hikerJoy.constants.forumPostPrmStatus.active)
                return dataBase.updateForumPostPrms({'_id': postPrm._id}, {'$set': {'statusId': hikerJoy.constants.forumPostPrmStatus.inactive}});
            else
                throw expectedError(hikerJoy.constants.disactivateForumPostPrm_rc.disactive);
        }
        else
            throw expectedError(hikerJoy.constants.disactivateForumPostPrm_rc.postPrmNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostPrm_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostPrm_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostPrm_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postSecId': }
//output: {'returnCode':, 'msg': }
var disactivateForumPostSec = function (pack) {
    var postSecId = pack.req.body.postSecId, authInfo = pack.req.session.user;
    if(!postSecId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostSec_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostSec_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canDisactivateForumPostSec({'sid': pack.req.session.sessionId, 'postSecId': postSecId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostSecFieldsBy({'_id': new objectId(postSecId)}, {'_id': 1, 'statusId': 1});
        else
            throw expectedError(hikerJoy.constants.disactivateForumPostSec_rc.notAuth);
    })
    .then(function (postSec) {
        if(postSec) {
            if(postSec.statusId === hikerJoy.constants.forumPostSecStatus.active)
                return dataBase.updateForumPostSecs({'_id': postSec._id}, {'$set': {'statusId': hikerJoy.constants.forumPostSecStatus.inactive}});
            else
                throw expectedError(hikerJoy.constants.disactivateForumPostSec_rc.disactive);
        }
        else
            throw expectedError(hikerJoy.constants.disactivateForumPostSec_rc.postSecNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostSec_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostSec_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateForumPostSec_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postId': }
//output: {'returnCode':, 'msg': }
var activateForumPost = function (pack) {
    var postId = pack.req.body.postId, authInfo = pack.req.session.user;
    if(!postId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPost_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPost_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canActivateForumPost({'sid': pack.req.session.sessionId, 'postId': postId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostFieldsBy({'_id': new objectId(postId)}, {'_id': 1, 'statusId': 1});
        else
            throw expectedError(hikerJoy.constants.activateForumPost_rc.notAuth);
    })
    .then(function (post) {
        if(post) {
            if(post.statusId === hikerJoy.constants.forumPostStatus.inactive)
                return dataBase.updateForumPosts({'_id': post._id}, {'$set': {'statusId': hikerJoy.constants.forumPostStatus.active}});
            else
                throw expectedError(hikerJoy.constants.activateForumPost_rc.active);
        }
        else
            throw expectedError(hikerJoy.constants.activateForumPost_rc.postNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPost_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPost_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPost_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postPrmId': }
//output: {'returnCode':, 'msg': }
var activateForumPostPrm = function (pack) {
    var postPrmId = pack.req.body.postPrmId, authInfo = pack.req.session.user;
    if(!postPrmId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostPrm_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostPrm_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canActivateForumPostPrm({'sid': pack.req.session.sessionId, 'postPrmId': postPrmId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostPrmFieldsBy({'_id': new objectId(postPrmId)}, {'_id': 1, 'statusId': 1});
        else
            throw expectedError(hikerJoy.constants.activateForumPostPrm_rc.notAuth);
    })
    .then(function (postPrm) {
        if(postPrm) {
            if(postPrm.statusId === hikerJoy.constants.forumPostPrmStatus.inactive)
                return dataBase.updateForumPostPrms({'_id': postPrm._id}, {'$set': {'statusId': hikerJoy.constants.forumPostPrmStatus.active}});
            else
                throw expectedError(hikerJoy.constants.activateForumPostPrm_rc.active);
        }
        else
            throw expectedError(hikerJoy.constants.activateForumPostPrm_rc.postPrmNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostPrm_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostPrm_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostPrm_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postSecId': }
//output: {'returnCode':, 'msg': }
var activateForumPostSec = function (pack) {
    var postSecId = pack.req.body.postSecId, authInfo = pack.req.session.user;
    if(!postSecId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostSec_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostSec_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canActivateForumPostSec({'sid': pack.req.session.sessionId, 'postSecId': postSecId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostSecFieldsBy({'_id': new objectId(postSecId)}, {'_id': 1, 'statusId': 1});
        else
            throw expectedError(hikerJoy.constants.activateForumPostSec_rc.notAuth);
    })
    .then(function (postSec) {
        if(postSec) {
            if(postSec.statusId === hikerJoy.constants.forumPostSecStatus.inactive)
                return dataBase.updateForumPostSecs({'_id': postSec._id}, {'$set': {'statusId': hikerJoy.constants.forumPostSecStatus.active}});
            else
                throw expectedError(hikerJoy.constants.activateForumPostSec_rc.active);
        }
        else
            throw expectedError(hikerJoy.constants.activateForumPostSec_rc.postSecNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostSec_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostSec_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.activateForumPostSec_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postId': }
//output: {'returnCode':, 'msg': }
var emphasizePost = function (pack) {
    var postId = pack.req.body.postId, authInfo = pack.req.session.user;
    if(!postId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.emphasizeForumPost_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.emphasizeForumPost_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canEmphasizePost({'sid': pack.req.session.sessionId, 'postId': postId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostFieldsBy({'_id': new objectId(postId)}, {'_id': 1, 'emphasis': 1});
        else
            throw expectedError(hikerJoy.constants.emphasizeForumPost_rc.notAuth);
    })
    .then(function (post) {
        if(post) {
            if(!post.emphasis)
                return dataBase.updateForumPosts({'_id': post._id}, {'$set': {'emphasis': true }});
            else
                throw expectedError(hikerJoy.constants.emphasizeForumPost_rc.emphasis);
        }
        else
            throw expectedError(hikerJoy.constants.emphasizeForumPost_rc.postNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.emphasizeForumPost_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.emphasizeForumPost_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.emphasizeForumPost_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postId': }
//output: {'returnCode':, 'msg': }
var fadeoutPost = function (pack) {
    var postId = pack.req.body.postId, authInfo = pack.req.session.user;
    if(!postId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.fadeoutForumPost_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.fadeoutForumPost_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canFadeoutPost({'sid': pack.req.session.sessionId, 'postId': postId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostFieldsBy({'_id': new objectId(postId)}, {'_id': 1, 'emphasis': 1});
        else
            throw expectedError(hikerJoy.constants.fadeoutForumPost_rc.notAuth);
    })
    .then(function (post) {
        if(post) {
            if(post.emphasis)
                return dataBase.updateForumPosts({'_id': post._id}, {'$set': {'emphasis': false }});
            else
                throw expectedError(hikerJoy.constants.fadeoutForumPost_rc.noemphasis);
        }
        else
            throw expectedError(hikerJoy.constants.fadeoutForumPost_rc.postNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.fadeoutForumPost_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.fadeoutForumPost_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.fadeoutForumPost_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postId':, 'tags': }
//output: {'returnCode':, 'msg': }
var updatePostTags = function (pack) {
    var postId = pack.req.body.postId, authInfo = pack.req.session.user, tags = pack.req.body.tags;
    if(!postId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.updatePostTags_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.updatePostTags_rc.notAuth));

    tags = hikerJoy.validate.adjustForumTags(tags);
    var defer = new Q.defer();
    authClient.authQuery.canUpdatePostTags({'sid': pack.req.session.sessionId, 'postId': postId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostFieldsBy({'_id': new objectId(postId)}, {'_id': 1});
        else
            throw expectedError(hikerJoy.constants.updatePostTags_rc.notAuth);
    })
    .then(function (post) {
        if(post)
            return dataBase.updateForumPosts({'_id': post._id}, {'$set': {'tags': tags }});
        else
            throw expectedError(hikerJoy.constants.updatePostTags_rc.postNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updatePostTags_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updatePostTags_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updatePostTags_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'postId':, 'label': }
//output: {'returnCode':, 'msg': }
var updatePostLabel = function (pack) {
    var postId = pack.req.body.postId, authInfo = pack.req.session.user, label = pack.req.body.label;
    if(!postId || !hikerJoy.validate.validateForumPostLabel(label))
        return attachToPack(pack, getRCObj(hikerJoy.constants.updatePostLabel_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.updatePostLabel_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canUpdatePostLabel({'sid': pack.req.session.sessionId, 'postId': postId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneForumPostFieldsBy({'_id': new objectId(postId)}, {'_id': 1});
        else
            throw expectedError(hikerJoy.constants.updatePostLabel_rc.notAuth);
    })
    .then(function (post) {
        if(post)
            return dataBase.updateForumPosts({'_id': post._id}, {'$set': {'label': label }});
        else
            throw expectedError(hikerJoy.constants.updatePostLabel_rc.postNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updatePostLabel_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updatePostLabel_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updatePostLabel_rc.unKnownError)));
        }
    });
    return defer.promise;
};

exports.disactivateForumPost = disactivateForumPost;
exports.disactivateForumPostPrm = disactivateForumPostPrm;
exports.disactivateForumPostSec = disactivateForumPostSec;
exports.activateForumPost = activateForumPost;
exports.activateForumPostPrm = activateForumPostPrm;
exports.activateForumPostSec = activateForumPostSec;
exports.emphasizePost = emphasizePost;
exports.fadeoutPost = fadeoutPost;
exports.updatePostTags = updatePostTags;
exports.updatePostLabel = updatePostLabel;
