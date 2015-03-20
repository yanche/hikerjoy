
var net = require('net');
var parseJSON = require('utility').parseJSON;
var authPort = require('hikerJoy').config.ports.authServer;
var Q = require('q');
var log = require('hikerJoy_logClient');

var authRequest = function (reqType, args) {
    var defer = new Q.defer();

    var client = new net.Socket();
    client.connect({ 'port': authPort });
    var req = { 'request': reqType, 'args': args };
    client.write(JSON.stringify(req));
    client.on('data', function (data) {
        var ret = parseJSON(data);
        if (!ret)
            defer.reject(new Error(reqType + ' no return or parse error'));
        else if (ret.err)
            defer.reject(ret.err);
        else
            defer.resolve(ret.val);
    }).on('error', function (err) {
        log.logError('authClient.js: ' + reqType + ' socket error.', args, err, '778D2B11-BB9A-47E1-AE73-B34C44B81DFC');
        defer.reject('authClient.js: ' + reqType + ' socket error: ' + err);
    });

    return defer.promise;
};

//input: {sid:, orgAlias:, actId}
//output: {auth: true or false, role:['god', 'ob', 'admin'...]}
var getRole = function (req) {
    return authRequest('getRole', { 'sid': req.sid, 'orgAlias': req.orgAlias, 'actId': req.actId });
};

//input: {'sid':, 'email':, 'hash_pwd':}
//output: {'auth': true or false}
var authenticate = function (req) {
    return authRequest('authenticate', { 'sid': req.sid, 'email': req.email, 'hash_pwd': req.hash_pwd });
};

//input: {'sid':}
//output: {'logout': true or false}
var logout = function (req) {
    return authRequest('logout', { 'sid': req.sid });
};

//input: {'sid':, 'email':, 'hash_pwd': 'name':, 'phone':, 'contact':, 'gender': }
//email/contact/hash_pwd should be in lower case
//output: {'returnCode':, 'msg':}
var register = function (req) {
    var arg = {
        'sid': req.sid,
        'email': req.email,
        'hash_pwd': req.hash_pwd,
        'name': req.name,
        'phone': req.phone,
        'contact': req.contact,
        'gender': req.gender,
        'nickName': req.nickName
    };
    return authRequest('register', arg);
};

//input: {'sid':, 'hash_originPwd':, 'hash_newPwd':}
//output: {'returnCode':, 'msg':}
var changePwd = function (req) {
    return authRequest('changePwd', { 'sid': req.sid, 'hash_originPwd': req.hash_originPwd, 'hash_newPwd': req.hash_newPwd });
};

//input: {'sid':, 'email':, 'hash_pwd':}
//output: {'returnCode':, 'msg':}
var updateUserEmail = function (req) {
    return authRequest('updateUserEmail', { 'sid': req.sid, 'email': req.email, 'hash_pwd': req.hash_pwd });
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var canUpdateOrgPic = function (req) {
    return authRequest('canUpdateOrgPic', { 'org': req.org, 'sid': req.sid });
};

//input: {'ticketId':}
//output: {'returnCode':, 'msg':}
var claimPwdReset = function (req) {
    return authRequest('claimPwdReset', { 'ticketId': req.ticketId });
};

//input: {'email':}
//output: {'returnCode':, 'msg':, 'ticketId': }
var pwdResetRequest = function (req) {
    return authRequest('pwdResetRequest', { 'email': req.email });
};

//input: {'orgAlias':, 'sid':}
//output: {'auth': true/false}
var canGetOrgActTemplates = function (req) {
    return authRequest('canGetOrgActTemplates', { 'org': req.orgAlias, 'sid': req.sid });
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var canGetOrgActiveActs = function (req) {
    return authRequest('canGetOrgActiveActs', { 'org': req.org, 'sid': req.sid });
};

//input: {'orgAlias':, 'sid':}
//output: {'auth': true/false}
var canUpsertOrgSignupSheetTemplate = function (req) {
    return authRequest('canUpsertOrgSignupSheetTemplate', { 'org': req.orgAlias, 'sid': req.sid });
};

//input: {'orgAlias':, 'sid':}
//output: {'auth': true/false}
var canRenameOrgSignupSheetTemplate = function (req) {
    return authRequest('canRenameOrgSignupSheetTemplate', { 'org': req.orgAlias, 'sid': req.sid });
};

//input: {'orgAlias':, 'sid':}
//output: {'auth': true/false}
var canDeleteOrgSignupSheetTemplate = function (req) {
    return authRequest('canDeleteOrgSignupSheetTemplate', { 'org': req.orgAlias, 'sid': req.sid });
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var canSubmitOrgActivity = function (req) {
    return authRequest('canSubmitOrgActivity', { 'org': req.org, 'sid': req.sid });
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var canGrantOrgAdmin = function (req) {
    return authRequest('canGrantOrgAdmin', { 'org': req.org, 'sid': req.sid });
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var canSetOrgActivityArchived = function (req) {
    return authRequest('canSetOrgActivityArchived', { 'org': req.org, 'sid': req.sid });
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var canSetOrgActivityRemoved = function (req) {
    return authRequest('canSetOrgActivityRemoved', { 'org': req.org, 'sid': req.sid });
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var canGetOrgAdmins = function (req) {
    return authRequest('canGetOrgAdmins', { 'org': req.org, 'sid': req.sid });
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var canRemoveOrgAdmin = function (req) {
    return authRequest('canRemoveOrgAdmin', { 'org': req.org, 'sid': req.sid });
};

//input: {'sid':}
//output: {'auth': true/false}
var canGetUsersInfo = function (req) {
    return authRequest('canGetUsersInfo', { 'sid': req.sid });
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var canUpdateOrgIntro = function (req) {
    return authRequest('canUpdateOrgIntro', { 'org': req.org, 'sid': req.sid });
};

//input: {'userActId':, 'sid':}
//output: {'auth': true/false}
var canUpdateMemberStatus = function (req) {
    return authRequest('canUpdateMemberStatus', { 'userActId': req.userActId, 'sid': req.sid });
};

//input: {'sid':}
//output: {'auth': true/false}
var canGetOrgAliasAvailability = function (req) {
    return authRequest('canGetOrgAliasAvailability', { 'sid': req.sid });
};

//input: {'sid':}
//output: {'auth': true/false}
var canReactivateOrg = function (req) {
    return authRequest('canReactivateOrg', { 'sid': req.sid });
};

//input: {'sid':}
//output: {'auth': true/false}
var canDisactivateOrg = function (req) {
    return authRequest('canDisactivateOrg', { 'sid': req.sid });
};

//input: {'sid':}
//output: {'auth': true/false}
var canUpdateOrgBasicInfo = function (req) {
    return authRequest('canUpdateOrgBasicInfo', { 'sid': req.sid });
};

//input: {'sid':}
//output: {'auth': true/false}
var canCreateNewOrg = function (req) {
    return authRequest('canCreateNewOrg', { 'sid': req.sid });
};

//input: {'sid':, 'actId': }
//output: {'auth': true/false}
var canSaveActBillStatement = function (req) {
    return authRequest('canSaveActBillStatement', { 'sid': req.sid, 'actId': req.actId });
};

//input: {'sid':, 'actId': }
//output: {'auth': true/false}
var canSaveActSummary = function (req) {
    return authRequest('canSaveActSummary', { 'sid': req.sid, 'actId': req.actId });
};

//input: {'sid':, 'org': }
//output: {'auth': true/false}
var canGetOrgAllFeedbacks = function (req) {
    return authRequest('canGetOrgAllFeedbacks', { 'sid': req.sid, 'org': req.org });
};

//input: {'sid': }
//output: {'auth': true/false}
var canGetSharedFeedbacks = function (req) {
    return authRequest('canGetSharedFeedbacks', { 'sid': req.sid });
};

//input: {'sid': }
//output: {'auth': true/false}, generally, only god can do this
var canRemoveActFromDB = function (req) {
    return authRequest('canRemoveActFromDB', { 'sid': req.sid });
};

//input: {'sid':, 'orgAlias': }
//output: {'auth': true/false}
var canGetOrgWeixinReplies = function (req) {
    return authRequest('canGetOrgWeixinReplies', { 'sid': req.sid, 'org': req.orgAlias });
};

//input: {'sid':, 'orgAlias': }
//output: {'auth': true/false}
var canSubmitOrgWeixinReply = function (req) {
    return authRequest('canSubmitOrgWeixinReply', { 'sid': req.sid, 'org': req.orgAlias });
};

//input: {'sid':, 'orgAlias': }
//output: {'auth': true/false}
var canArchiveOrgWeixinReply = function (req) {
    return authRequest('canArchiveOrgWeixinReply', { 'sid': req.sid, 'org': req.orgAlias });
};

//input: {'sid':, 'org': }
//output: {'auth': true/false}
var canSetOrgShareState = function (req) {
    return authRequest('canSetOrgShareState', { 'sid': req.sid, 'org': req.org });
};

//output: {'n':, 'e':, 'd': }
var getRSA = function (req) {
    return authRequest('getRSA', {});
};

//input: {'sid':, 'target': }
//output: {'returnCode':, 'msg': }
var userInjection = function (req) {
    return authRequest('userInjection', { 'sid': req.sid, 'target': req.target });
};

//input: {'sid':, }
//output: session or null
var getSession = function (req) {
    return authRequest('getSession', { 'sid': req.sid });
};

//input: {'sid':, }
//output: session
var getOrCreateSession = function (req) {
    return authRequest('getOrCreateSession', { 'sid': req.sid });
};

//input: {'sid':, 'aliasORid': }
//output: {'auth': true/false}
var canDoForumPost = function (req) {
    return authRequest('canDoForumPost', { 'sid': req.sid, 'aliasORid': req.aliasORid });
};

//input: {'sid':, 'postId': }
//output: {'auth': true/false}
var canDisactivateForumPost = function (req) {
    return authRequest('canDisactivateForumPost', { 'sid': req.sid, 'postId': req.postId });
};

//input: {'sid':, 'postId': }
//output: {'auth': true/false}
var canActivateForumPost = function (req) {
    return authRequest('canActivateForumPost', { 'sid': req.sid, 'postId': req.postId });
};

//input: {'sid':, 'postId': }
//output: {'auth': true/false}
var canEmphasizePost = function (req) {
    return authRequest('canEmphasizePost', { 'sid': req.sid, 'postId': req.postId });
};

//input: {'sid':, 'postId': }
//output: {'auth': true/false}
var canFadeoutPost = function (req) {
    return authRequest('canFadeoutPost', { 'sid': req.sid, 'postId': req.postId });
};

//input: {'sid':, 'postId': }
//output: {'auth': true/false}
var canUpdatePostTags = function (req) {
    return authRequest('canUpdatePostTags', { 'sid': req.sid, 'postId': req.postId });
};

//input: {'sid':, 'postId': }
//output: {'auth': true/false}
var canUpdatePostLabel = function (req) {
    return authRequest('canUpdatePostLabel', { 'sid': req.sid, 'postId': req.postId });
};

//input: {'sid':, 'postPrmId': }
//output: {'auth': true/false}
var canDisactivateForumPostPrm = function (req) {
    return authRequest('canDisactivateForumPostPrm', { 'sid': req.sid, 'postPrmId': req.postPrmId });
};

//input: {'sid':, 'postPrmId': }
//output: {'auth': true/false}
var canActivateForumPostPrm = function (req) {
    return authRequest('canActivateForumPostPrm', { 'sid': req.sid, 'postPrmId': req.postPrmId });
};

//input: {'sid':, 'postSecId': }
//output: {'auth': true/false}
var canDisactivateForumPostSec = function (req) {
    return authRequest('canDisactivateForumPostSec', { 'sid': req.sid, 'postSecId': req.postSecId });
};

//input: {'sid':, 'postSecId': }
//output: {'auth': true/false}
var canActivateForumPostSec = function (req) {
    return authRequest('canActivateForumPostSec', { 'sid': req.sid, 'postSecId': req.postSecId });
};

//input: {'sid':, 'org': }
//output: {'auth': true/false}
var canUnauthorizeUserToPost = function (req) {
    return authRequest('canUnauthorizeUserToPost', { 'sid': req.sid, 'org': req.org });
};

//input: {'sid':, 'org': }
//output: {'auth': true/false}
var canAuthorizeUserToPost = function (req) {
    return authRequest('canAuthorizeUserToPost', { 'sid': req.sid, 'org': req.org });
};

//input: {'sid':, 'org': }
//output: {'auth': true/false}
var canGetForumUnauthorizedUsers = function (req) {
    return authRequest('canGetForumUnauthorizedUsers', { 'sid': req.sid, 'org': req.org });
};

//input: {'sid': }
//output: {'auth': true/false}
var canGetAllActiveActs = function (req) {
    return authRequest('canGetAllActiveActs', { 'sid': req.sid });
};

//input: { 'actIdlist': [ array of actId ], 'sid': }
//output: { 'authList': [ {'_id':, 'operate': } ] }
var canGetActivityMembers = function (req) {
    return authRequest('canGetActivityMembers', { 'sid': req.sid, 'actIdlist': req.actIdlist });
};

//input: { 'actIdlist': [ array of actId ], 'sid': }
//output: { 'authList': [ {'actId':, 'summary': true or false, 'billstatement': true or false } ] }
var canGetActivityFeedback = function (req) {
    return authRequest('canGetActivityFeedback', { 'sid': req.sid, 'actIdlist': req.actIdlist });
};

//input: { 'memberIdlist': [ array of memberId(userActs._id) ], 'sid': }
//output: { 'authList': [ array of id ] }
var canSendEmailToActivityMembers = function (req) {
    return authRequest('canSendEmailToActivityMembers', { 'sid': req.sid, 'memberIdlist': req.memberIdlist });
};

//input: {'sid':, 'orgAlias': }
//output: {'auth': true/false}
var canGetOrgWeixinId = function (req) {
    return authRequest('canGetOrgWeixinId', { 'sid': req.sid, 'org': req.orgAlias });
};

//input: {'sid':, 'orgAlias': }
//output: {'auth': true/false}
var canSubmitOrgWeixinId = function (req) {
    return authRequest('canSubmitOrgWeixinId', { 'sid': req.sid, 'org': req.orgAlias });
};

//input: {'orgAlias':, 'sid':}
//output: {'auth': true/false}
var canGetOrgShareStatus = function (req) {
    return authRequest('canGetOrgShareStatus', { 'org': req.orgAlias, 'sid': req.sid });
};

//input: {'orgAlias':, 'sid':}
//output: {'auth': true/false}
var canGetOrgWeixinKeywords = function (req) {
    return authRequest('canGetOrgWeixinKeywords', { 'org': req.orgAlias, 'sid': req.sid });
};

//input: {'orgAlias':, 'sid': }
//output: {'auth': true/false}
var canSubmitOrgWeixinKeywords = function (req) {
    return authRequest('canSubmitOrgWeixinKeywords', { 'org': req.orgAlias, 'sid': req.sid });
};

//input: {'sid': }
//output: {'auth': true/false}
var canGetSharingOrgs = function (req) {
    return authRequest('canGetSharingOrgs', { 'sid': req.sid });
};

exports.authenticate = authenticate;
exports.getRole = getRole;
exports.logout = logout;
exports.register = register;
exports.changePwd = changePwd;
exports.updateUserEmail = updateUserEmail;
exports.claimPwdReset = claimPwdReset;
exports.pwdResetRequest = pwdResetRequest;
exports.getRSA = getRSA;
exports.userInjection = userInjection;
exports.getSession = getSession;
exports.getOrCreateSession = getOrCreateSession;

exports.authQuery = {
    'canUpdateOrgPic': canUpdateOrgPic,
    'canGetOrgActiveActs': canGetOrgActiveActs,
    'canSubmitOrgActivity': canSubmitOrgActivity,
    'canGrantOrgAdmin': canGrantOrgAdmin,
    'canSetOrgActivityArchived': canSetOrgActivityArchived,
    'canSetOrgActivityRemoved': canSetOrgActivityRemoved,
    'canGetOrgAdmins': canGetOrgAdmins,
    'canRemoveOrgAdmin': canRemoveOrgAdmin,
    'canGetUsersInfo': canGetUsersInfo,
    'canUpdateOrgIntro': canUpdateOrgIntro,
    'canUpdateMemberStatus': canUpdateMemberStatus,
    'canGetOrgAliasAvailability': canGetOrgAliasAvailability,
    'canReactivateOrg': canReactivateOrg,
    'canDisactivateOrg': canDisactivateOrg,
    'canUpdateOrgBasicInfo': canUpdateOrgBasicInfo,
    'canCreateNewOrg': canCreateNewOrg,
    'canSaveActBillStatement': canSaveActBillStatement,
    'canSaveActSummary': canSaveActSummary,
    'canGetOrgAllFeedbacks': canGetOrgAllFeedbacks,
    'canGetSharedFeedbacks': canGetSharedFeedbacks,
    'canRemoveActFromDB': canRemoveActFromDB,
    'canSetOrgShareState': canSetOrgShareState,
    'canDoForumPost': canDoForumPost,
    'canDisactivateForumPost': canDisactivateForumPost,
    'canActivateForumPost': canActivateForumPost,
    'canEmphasizePost': canEmphasizePost,
    'canFadeoutPost': canFadeoutPost,
    'canUpdatePostTags': canUpdatePostTags,
    'canUpdatePostLabel': canUpdatePostLabel,
    'canDisactivateForumPostPrm': canDisactivateForumPostPrm,
    'canActivateForumPostPrm': canActivateForumPostPrm,
    'canDisactivateForumPostSec': canDisactivateForumPostSec,
    'canActivateForumPostSec': canActivateForumPostSec,
    'canUnauthorizeUserToPost': canUnauthorizeUserToPost,
    'canAuthorizeUserToPost': canAuthorizeUserToPost,
    'canGetForumUnauthorizedUsers': canGetForumUnauthorizedUsers,


    //activity
    'canGetAllActiveActs': canGetAllActiveActs,
    'canGetActivityMembers': canGetActivityMembers,
    'canSendEmailToActivityMembers': canSendEmailToActivityMembers,

    //feedback
    'canGetActivityFeedback': canGetActivityFeedback,

    //org
    'canGetOrgWeixinId': canGetOrgWeixinId,
    'canSubmitOrgWeixinId': canSubmitOrgWeixinId,
    'canGetOrgWeixinReplies': canGetOrgWeixinReplies,
    'canSubmitOrgWeixinReply': canSubmitOrgWeixinReply,
    'canArchiveOrgWeixinReply': canArchiveOrgWeixinReply,
    'canGetOrgActTemplates': canGetOrgActTemplates,
    'canUpsertOrgSignupSheetTemplate': canUpsertOrgSignupSheetTemplate,
    'canRenameOrgSignupSheetTemplate': canRenameOrgSignupSheetTemplate,
    'canDeleteOrgSignupSheetTemplate': canDeleteOrgSignupSheetTemplate,
    'canGetOrgShareStatus': canGetOrgShareStatus,
    'canGetOrgWeixinKeywords': canGetOrgWeixinKeywords,
    'canSubmitOrgWeixinKeywords': canSubmitOrgWeixinKeywords,

    //share
    'canGetSharingOrgs': canGetSharingOrgs
};
