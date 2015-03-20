
var net = require('net');
var port = require('hikerJoy').config.ports.authServer;
var sess = require('./session.js');
var authentication = require('./authentication.js');
var authorization = require('./authorization.js');
var Q = require('q');
var log = require('hikerJoy_logClient');

var server = net.createServer();

server.on('listening', function () { console.log('auth server start listening at port: ' + port + '...'); });

server.on('connection', function (socket) {
    initialRequest(socket)
    .then(JSON.parse)
    .then(processRequest)
    .then(function (val) {
        response(val, socket);
    })
    .fail(function (err) {
        log.logError('authServer.js: got error.', null, err, '4784DFE7-887B-498E-9561-8872BA99C37B');
        reject(err, socket);
    });
});

var initialRequest = function (socket) {
    var defer = new Q.defer();
    socket.on('data', function (data) {
        defer.resolve(data);
    }).on('error', function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

var processRequest = function (req) {
    if (req && req.request && reqMappings[req.request]) {
        return reqMappings[req.request](req.args); //should return a promise
    }
    else {
        throw new Error('request not found: ' + req ? '' : req.request);
    };
};

var reject = function (err, socket) {
    err = err || 'no specified error';
    var ret = { 'err': err.toString() };
    var str = JSON.stringify(ret);
    socket.end(str);
};

var response = function (val, socket) {
    if (socket == null)
        return;

    var str = '';
    try {
        val = val === undefined ? null : val;
        var ret = { 'val': val };
        str = JSON.stringify(ret);
    }
    catch (err) {
        console.log('failed to stringify auth server response, val: ' + val + '. err: ' + err);
        str = JSON.stringify({ 'val': {} });
    };

    try {
        socket.end(str);
    }
    catch (err) {
        console.log('auth server failed to response, err: ' + err);
    }
};

var getOrCreateSession = function (args) {
    return sess.getOrCreateSession(args.sid);
};

var getSession = function (args) {
    return sess.getSession(args.sid);
};

var reqMappings = {
    'getOrCreateSession': getOrCreateSession,
    'getSession': getSession,
    'authenticate': authentication.authenticate,
    'logout': authentication.logout,
    'getRole': authorization.getRole,
    'register': authentication.register,
    'changePwd': authentication.changePwd,
    'updateUserEmail': authentication.updateUserEmail,
    'claimPwdReset': authentication.claimPwdReset,
    'pwdResetRequest': authentication.pwdResetRequest,
    'getRSA': authentication.getRSA,
    'userInjection': authentication.userInjection,

    'canUpdateOrgPic': authorization.canUpdateOrgPic,
    'canGetOrgActiveActs': authorization.canGetOrgActiveActs,
    'canSubmitOrgActivity': authorization.canSubmitOrgActivity,
    'canGrantOrgAdmin': authorization.canGrantOrgAdmin,
    'canSetOrgActivityArchived': authorization.canSetOrgActivityArchived,
    'canSetOrgActivityRemoved': authorization.canSetOrgActivityRemoved,
    'canGetOrgAdmins': authorization.canGetOrgAdmins,
    'canRemoveOrgAdmin': authorization.canRemoveOrgAdmin,
    'canGetUsersInfo': authorization.canGetUsersInfo,
    'canUpdateMemberStatus': authorization.canUpdateMemberStatus,
    'canGetOrgAliasAvailability': authorization.canGetOrgAliasAvailability,
    'canReactivateOrg': authorization.canReactivateOrg,
    'canDisactivateOrg': authorization.canDisactivateOrg,
    'canUpdateOrgBasicInfo': authorization.canUpdateOrgBasicInfo,
    'canCreateNewOrg': authorization.canCreateNewOrg,
    'canSaveActBillStatement': authorization.canSaveActBillStatement,
    'canSaveActSummary': authorization.canSaveActSummary,
    'canGetOrgAllFeedbacks': authorization.canGetOrgAllFeedbacks,
    'canGetSharedFeedbacks': authorization.canGetSharedFeedbacks,
    'canRemoveActFromDB': authorization.canRemoveActFromDB,
    'canSetOrgShareState': authorization.canSetOrgShareState,
    'canDoForumPost': authorization.canDoForumPost,
    'canDisactivateForumPost': authorization.canDisactivateForumPost,
    'canActivateForumPost': authorization.canActivateForumPost,
    'canEmphasizePost': authorization.canEmphasizePost,
    'canFadeoutPost': authorization.canFadeoutPost,
    'canUpdatePostTags': authorization.canUpdatePostTags,
    'canUpdatePostLabel': authorization.canUpdatePostLabel,
    'canDisactivateForumPostPrm': authorization.canDisactivateForumPostPrm,
    'canActivateForumPostPrm': authorization.canActivateForumPostPrm,
    'canDisactivateForumPostSec': authorization.canDisactivateForumPostSec,
    'canActivateForumPostSec': authorization.canActivateForumPostSec,
    'canUnauthorizeUserToPost': authorization.canUnauthorizeUserToPost,
    'canAuthorizeUserToPost': authorization.canAuthorizeUserToPost,
    'canGetForumUnauthorizedUsers': authorization.canGetForumUnauthorizedUsers,

    //activity
    'canGetAllActiveActs': authorization.canGetAllActiveActs,
    'canGetActivityMembers': authorization.canGetActivityMembers,
    'canSendEmailToActivityMembers': authorization.canSendEmailToActivityMembers,

    //feedback
    'canGetActivityFeedback': authorization.canGetActivityFeedback,

    //org
    'canGetOrgWeixinId': authorization.canGetOrgWeixinId,
    'canSubmitOrgWeixinId': authorization.canSubmitOrgWeixinId,
    'canGetOrgWeixinReplies': authorization.canGetOrgWeixinReplies,
    'canSubmitOrgWeixinReply': authorization.canSubmitOrgWeixinReply,
    'canArchiveOrgWeixinReply': authorization.canArchiveOrgWeixinReply,
    'canUpdateOrgIntro': authorization.canUpdateOrgIntro,
    'canGetOrgActTemplates': authorization.canGetOrgActTemplates,
    'canUpsertOrgSignupSheetTemplate': authorization.canUpsertOrgSignupSheetTemplate,
    'canRenameOrgSignupSheetTemplate': authorization.canRenameOrgSignupSheetTemplate,
    'canDeleteOrgSignupSheetTemplate': authorization.canDeleteOrgSignupSheetTemplate,
    'canGetOrgShareStatus': authorization.canGetOrgShareStatus,
    'canGetOrgWeixinKeywords': authorization.canGetOrgWeixinKeywords,
    'canSubmitOrgWeixinKeywords': authorization.canSubmitOrgWeixinKeywords,

    //share
    'canGetSharingOrgs': authorization.canGetSharingOrgs
};


server.on('error', function (err) {
    log.logCritical('authServer.js server got error.', null, err, '14656695-2A2F-4182-BC11-864734858723');
    console.log('auth server error: ' + err);
});

process.on('exit', function () {
    log.logCritical('authServer.js exists.', null, null, '740B2160-1E24-4A64-A3DF-FFBC1FD4D181');
    console.log('authServer.js exists');
});

process.on('uncaughtException', function (err) {
    log.logCritical('authServer.js caught exception.', null, err, '9FF6CBA1-FACA-4C89-AB98-85B765D3DD9F');
    console.log('authServer.js caught exception: ' + err);
});

server.listen(port);