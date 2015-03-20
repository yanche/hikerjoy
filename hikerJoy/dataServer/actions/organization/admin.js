
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var getRCObj = helper.getRCObj;
var attachToPack = helper.attachToPack;
var expectedError = helper.expectedError;
var objectId = require('mongodb').ObjectID;
var utility = require('utility');
var Q = require('q');

//input: {'orgAlias': }
//output: [ {'_id':, 'personalInfo': {}, 'nickName': } ]
var getOrgAdmin = function (pack) {
    var emptyRet = [], orgAlias = pack.req.body.orgAlias;
    if (!pack.req.session.user || !hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer();
    authClient.authQuery.canGetOrgAdmins({ 'org': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth === true)
            return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { 'admins': 1 });
        else
            throw expectedError('not authed to getOrgAdmin');
    })
    .then(function (org) {
        if (org && hikerJoy.validate.validateNonEmptyArray(org.admins))
            return dataBase.getActiveUsersFieldsBy({ '_id': { '$in': org.admins } }, { '_id': 1, 'personalInfo': 1, 'nickName': 1 });
        else
            throw expectedError('org with alias not found: ' + orgAlias);
    })
    .then(function (adminInfo) {
        if (hikerJoy.validate.validateNonEmptyArray(adminInfo))
            defer.resolve(attachToPack(pack, adminInfo));
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'userId':, 'orgAlias': }
//output: {'returnCode':, 'msg':}
var grantUserOrgAdmin = function (pack) {
    if (!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.grantUserOrgAdmin_rc.notAuth));
    var userObjId = utility.tryConvert2ObjId(pack.req.body.userId), orgAlias = pack.req.body.orgAlias;
    if (!userObjId || !hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, getRCObj(hikerJoy.constants.grantUserOrgAdmin_rc.inputParaError));

    var sid = pack.req.session.sessionId, defer = new Q.defer(), orgFullName = null;
    authClient.authQuery.canGrantOrgAdmin({ 'org': orgAlias, 'sid': sid })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneActiveUserFieldsBy({ '_id': userObjId }, { '_id': 1, 'special': 1 });
        else
            throw expectedError(hikerJoy.constants.grantUserOrgAdmin_rc.notAuth);
    })
    .then(function (user) {
        if (user) {
            if (user.special !== 0) //special user: god or ob
                throw expectedError(hikerJoy.constants.grantUserOrgAdmin_rc.cannotAuthorize);
            else
                return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { 'admins': 1, 'fullName': 1 });
        }
        else
            throw expectedError(hikerJoy.constants.grantUserOrgAdmin_rc.userNotFound);
    })
    .then(function (org) {
        if (org) {
            if (Array.isArray(org.admins) && org.admins.containsObjectId(userObjId)) //already admin
                throw expectedError(hikerJoy.constants.grantUserOrgAdmin_rc.alreadyAdmin);
            else {
                orgFullName = org.fullName;
                return dataBase.updateActiveOrgs({ 'alias': orgAlias }, { '$addToSet': { 'admins': userObjId } });
            }
        }
        else
            throw expectedError(hikerJoy.constants.grantUserOrgAdmin_rc.unKnownError);
    })
    .then(function (ct) {
        if (ct) {
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.grantUserOrgAdmin_rc.success)));
            var msg = __generateMsgForGrantAdminNotification(orgFullName, orgAlias);
            dataBase.createUserMessage(0, userObjId, msg.subject, msg.body, false);
        }
        else
            throw expectedError(hikerJoy.constants.grantUserOrgAdmin_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.grantUserOrgAdmin_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias':, 'userId': }
//output: {'returnCode':, 'msg':}
var removeOrgAdmin = function (pack) {
    if (!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.removeOrgAdmin_rc.notAuth));
    var userObjId = utility.tryConvert2ObjId(pack.req.body.userId), orgAlias = pack.req.body.orgAlias;
    if (!userObjId || !hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, getRCObj(hikerJoy.constants.removeOrgAdmin_rc.inputParaError));

    var defer = new Q.defer(), orgFullName = null;
    authClient.authQuery.canRemoveOrgAdmin({ 'org': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth === true)
            return Q.all([dataBase.getOneUserFieldsBy({ '_id': userObjId }, { '_id': 1 }), dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1, 'fullName': 1 })]);
        else
            throw expectedError(hikerJoy.constants.removeOrgAdmin_rc.notAuth);
    })
    .then(function (data) {
        var user = data[0], org = data[1];
        if (!user)
            throw expectedError(hikerJoy.constants.removeOrgAdmin_rc.userNotFound);
        else if (!org)
            throw expectedError(hikerJoy.constants.removeOrgAdmin_rc.orgNotFound);
        else {
            orgFullName = org.fullName;
            return dataBase.updateActiveOrgs({ '_id': org._id }, { '$pull': { 'admins': user._id } });
        }
    })
    .then(function (ct) {
        if (ct > 0) {
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.removeOrgAdmin_rc.success)));
            var msg = __generateMsgForRemoveAdminNotification(orgFullName, orgAlias);
            dataBase.createUserMessage(0, userObjId, msg.subject, msg.body, false);
        }
        else if (ct === 0)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.removeOrgAdmin_rc.notAdmin)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.removeOrgAdmin_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.removeOrgAdmin_rc.unKnownError)));
        }
    });
    return defer.promise;
};

var __generateMsgForGrantAdminNotification = function (orgFullName, orgAlias) {
    var subject = '你被邀请成为 ' + orgFullName + ' 的社团管理员！';
    var body = [{
        'T': 'P', 'C': [
            { 'T': 'text', 'V': '进入“' },
            { 'T': 'A', 'V': hikerJoy.config.siteUrl + '/' + orgAlias + '/manage', 'C': [{ 'T': 'text', 'V': '管理页' }] },
            { 'T': 'text', 'V': '”来协助管理社团吧！ ^^' }
        ]
    }];
    return { 'subject': subject, 'body': body };
};

var __generateMsgForRemoveAdminNotification = function (orgFullName) {
    var subject = '你被从 ' + orgFullName + ' 的社团管理员名单中移除';
    var body = [{ 'T': 'text', 'V': '_(:з」∠)_ 挽尊...' }];
    return { 'subject': subject, 'body': body };
};

exports.getOrgAdmin = getOrgAdmin;
exports.grantUserOrgAdmin = grantUserOrgAdmin;
exports.removeOrgAdmin = removeOrgAdmin;
