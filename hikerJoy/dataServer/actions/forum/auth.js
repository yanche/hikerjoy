
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

//input: {'userId':, 'orgAlias': }
//output: {'returnCode':, 'msg': }
var unauthorizeUserToPost = function (pack) {
    var userId = pack.req.body.userId, orgAlias = pack.req.body.orgAlias, authInfo = pack.req.session.user;
    if(!userId || !hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, getRCObj(hikerJoy.constants.unauthorizeUserToPost_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.unauthorizeUserToPost_rc.notAuth));

    var defer = new Q.defer(), userObjId = null;
    authClient.authQuery.canUnauthorizeUserToPost({'sid': pack.req.session.sessionId, 'org': orgAlias })
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneActiveUserFieldsBy({'_id': new objectId(userId)}, {'_id': 1, 'special': 1});
        else
            throw expectedError(hikerJoy.constants.unauthorizeUserToPost_rc.notAuth);
    })
    .then(function (user) {
        if(user) {
            if(user.special)
                throw expectedError(hikerJoy.constants.unauthorizeUserToPost_rc.special);
            else {
                userObjId = user._id;
                return dataBase.getOneActiveOrgFieldsBy({'alias': orgAlias}, {'_id': 1, 'noForumPostUserIdList': 1});
            }
        }
        else
            throw expectedError(hikerJoy.constants.unauthorizeUserToPost_rc.userNotFound);
    })
    .then(function (org) {
        if(org) {
            if(Array.isArray(org.noForumPostUserIdList) && org.noForumPostUserIdList.containsObjectId(userObjId))
                throw expectedError(hikerJoy.constants.unauthorizeUserToPost_rc.unauth);
            else
                return dataBase.updateOrgs({'_id': org._id}, {'$push': {'noForumPostUserIdList': userObjId}});
        }
        else
            throw expectedError(hikerJoy.constants.unauthorizeUserToPost_rc.orgNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.unauthorizeUserToPost_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.unauthorizeUserToPost_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.unauthorizeUserToPost_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'userId':, 'orgAlias': }
//output: {'returnCode':, 'msg': }
var authorizeUserToPost = function (pack) {
    var userId = pack.req.body.userId, orgAlias = pack.req.body.orgAlias, authInfo = pack.req.session.user;
    if(!userId || !hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, getRCObj(hikerJoy.constants.authorizeUserToPost_rc.inputParaError));
    if(!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.authorizeUserToPost_rc.notAuth));

    var defer = new Q.defer(), userObjId = null;
    authClient.authQuery.canAuthorizeUserToPost({'sid': pack.req.session.sessionId, 'org': orgAlias })
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneActiveUserFieldsBy({'_id': new objectId(userId)}, {'_id': 1, 'special': 1});
        else
            throw expectedError(hikerJoy.constants.authorizeUserToPost_rc.notAuth);
    })
    .then(function (user) {
        if(user) {
            if(user.special)
                throw expectedError(hikerJoy.constants.authorizeUserToPost_rc.special);
            else {
                userObjId = user._id;
                return dataBase.getOneActiveOrgFieldsBy({'alias': orgAlias}, {'_id': 1, 'noForumPostUserIdList': 1});
            }
        }
        else
            throw expectedError(hikerJoy.constants.authorizeUserToPost_rc.userNotFound);
    })
    .then(function (org) {
        if(org) {
            if(Array.isArray(org.noForumPostUserIdList) && org.noForumPostUserIdList.containsObjectId(userObjId))
                return dataBase.updateOrgs({'_id': org._id}, {'$pull': {'noForumPostUserIdList': userObjId}});
            else
                throw expectedError(hikerJoy.constants.authorizeUserToPost_rc.auth);
        }
        else
            throw expectedError(hikerJoy.constants.authorizeUserToPost_rc.orgNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.authorizeUserToPost_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.authorizeUserToPost_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.authorizeUserToPost_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias': }
//output: [ {'_id':, 'name':, 'nickName':, 'email': } ]
var getUnauthorizedUsers = function (pack) {
    var orgAlias = pack.req.body.orgAlias, emptyRet = [];
    if(!hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, emptyRet);
    
    var defer = new Q.defer();
    authClient.authQuery.canGetForumUnauthorizedUsers({'sid': pack.req.session.sessionId, 'org': orgAlias})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneActiveOrgFieldsBy({'alias': orgAlias}, {'noForumPostUserIdList': 1});
        else
            throw expectedError('user not authorized to getUnauthorizedUsers, orgAlias: ' + orgAlias);
    })
    .then(function (org) {
        if(org) {
            if(!Array.isArray(org.noForumPostUserIdList))
                org.noForumPostUserIdList = [];
            return dataBase.getUsersFieldsBy({'_id': {'$in': org.noForumPostUserIdList}}, {'_id': 1, 'personalInfo.name': 1, 'personalInfo.email': 1, 'nickName': 1});
        }
        else
            throw expectedError('org not found, orgAlias: ' + orgAlias);
    })
    .then(function (users) {
        if(Array.isArray(users) && users.length > 0) {
            var ret = users.map(function (user) {
                return {'_id': user._id, 'name': user.personalInfo.name, 'email': user.personalInfo.email, 'nickName': user.nickName};
            });
            defer.resolve(attachToPack(pack, ret));
        }
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

exports.unauthorizeUserToPost = unauthorizeUserToPost;
exports.authorizeUserToPost = authorizeUserToPost;
exports.getUnauthorizedUsers = getUnauthorizedUsers;
