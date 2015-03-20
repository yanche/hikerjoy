
var security = require('./actions/security.js');
var user = require('./actions/user.js');
var org = require('./actions/org.js');
var activity = require('./actions/activity.js');
var admin = require('./actions/admin.js');
var library = require('./actions/library.js');
var forum = require('./actions/forum.js');
var pagefail = require('./actions/pagefail.js');
var url = require('url');

var security = {
    'POST': {
        'authenticate': security.authenticate,
        'register': security.register,
        'getRole': security.getRole,
        'logout': security.logout,
        'changePwd': security.changePwd,
        'updateUserEmail': security.updateUserEmail,
        'claimPwdReset': security.claimPwdReset,
        'pwdResetRequest': security.pwdResetRequest,
        'getRSAPublicKey': security.getRSAPublicKey
    }
};
var userActions = {
    'POST': {
        'getUserEmail': user.getUserEmail,
        'userNickNameAvailable': user.userNickNameAvailable,
        'userEmailAvailable': user.userEmailAvailable,
        'getUserFootprint': user.getUserFootprint,
        'userActQuit': user.userActQuit,
        'updateUserSignupSheet': user.updateUserSignupSheet,
        'getUserPersonalInfo': user.getUserPersonalInfo,
        'getUserName': user.getUserName,
        'updateUserPersonalInfo': user.updateUserPersonalInfo,
        'orgActSignUp': user.orgActSignUp,
        'getUserMessages': user.getUserMessages,
        'getUserUnreadMsgCount': user.getUserUnreadMsgCount,
        'sendUserMessage': user.sendUserMessage,
        'markUserMessageRead': user.markUserMessageRead,
        'markUserReceivedMessageDelete': user.markUserReceivedMessageDelete,
        'markUserSendMessageDelete': user.markUserSendMessageDelete,
        'updateMemberStatus': user.updateMemberStatus,

        // user search
        'queryUserByNickNameOrNameOrEmail': user.queryUserByNickNameOrNameOrEmail,
        'queryUserById': user.queryUserById
    }
};
var orgActions = {
    'POST': {
        'getOrgAdmin': org.getOrgAdmin,
        'grantUserOrgAdmin': org.grantUserOrgAdmin,
        'removeOrgAdmin': org.removeOrgAdmin,
        'getOrgContext': org.getOrgContext,
        'uploadOrgPic': org.uploadOrgPic,
        'getOrgActTemplates': org.getOrgActTemplates,
        'upsertOrgSignupSheetTemplate': org.upsertOrgSignupSheetTemplate,
        'renameOrgSignupSheetTemplate': org.renameOrgSignupSheetTemplate,
        'deleteOrgSignupSheetTemplate': org.deleteOrgSignupSheetTemplate,
        'updateOrgIntro': org.updateOrgIntro,
        'getOrgIntro': org.getOrgIntro,
        'getOrgWeixinId': org.getOrgWeixinId,
        'submitOrgWeixinId': org.submitOrgWeixinId,
        'getOrgWeixinReplies': org.getOrgWeixinReplies,
        'submitOrgWeixinReply': org.submitOrgWeixinReply,
        'archiveOrgWeixinReply': org.archiveOrgWeixinReply,
        'getOrgWeixinShareInfo': org.getOrgWeixinShareInfo,
        'getOrgWeixinKeywords': org.getOrgWeixinKeywords,
        'submitOrgWeixinKeyword': org.submitOrgWeixinKeyword,
        'setShareSummary': org.setShareSummary,
        'setShareBillStatement': org.setShareBillStatement,
        'getOrgShareStatus': org.getOrgShareStatus
    }
};

var activityActions = {
    'POST': {
        'setOrgActArchived': activity.setOrgActArchived,
        'setOrgActRemoved': activity.setOrgActRemoved,
        'submitOrgActivity': activity.submitOrgActivity,
        'getAllActiveActs': activity.getAllActiveActs,
        'getAllActiveActs_MyLeadershipOrAdmin': activity.getAllActiveActs_MyLeadershipOrAdmin,
        'getAllActiveActsCount_MyLeadershipOrAdmin': activity.getAllActiveActsCount_MyLeadershipOrAdmin,
        'getOpeningActs': activity.getOpeningActs,
        'getHistoricalActs': activity.getHistoricalActs,
        'getOpeningActsRecord': activity.getOpeningActsRecords,
        'getHistoricalActsRecords': activity.getHistoricalActsRecords,
        'getMyLeadershipActiveActivity': activity.getMyLeadershipActiveActivity,
        'getMyLeadershipHistoricalActivity': activity.getMyLeadershipHistoricalActivity,
        'getActRecruitment': activity.getActRecruitment,
        'sendEmailToActMembers': activity.sendEmailToActMembers,
        'getActivityFeedback': activity.getActivityFeedback,
        'saveActBillStatement': activity.saveActBillStatement,
        'saveActSummary': activity.saveActSummary,
        'queryActivityTags': activity.queryActivityTags,
        'getActWeixinShareInfo': activity.getActWeixinShareInfo,
        'getAllActivityTags': activity.getAllActivityTags,
        'getActivityMembers': activity.getActivityMembers
    }
};

var adminActions = {
    'POST': {
        'reactivateOrg': admin.reactivateOrg,
        'disactivateOrg': admin.disactivateOrg,
        'orgAliasAvailable': admin.orgAliasAvailable,
        'updateOrgBasicInfo': admin.updateOrgBasicInfo,
        'createNewOrg': admin.createNewOrg,
        'userInjection': admin.userInjection
    }
};

var libraryActions = {
    'POST': {
        'getSharedActivityIdListByTag': library.getSharedActivityIdListByTag,
        'getSharingOrgs': library.getSharingOrgs
    }
};

var forumActions = {
    'POST': {
        'getForumPostList': forum.getForumPostList,
        'getForumPostPrms': forum.getForumPostPrms,
        'getForumPostSecs': forum.getForumPostSecs,
        'getRelatedEmphasizedForumPostsByActivityTag': forum.getRelatedEmphasizedForumPostsByActivityTag,
        'submitForumPostSec': forum.submitForumPostSec,
        'submitForumPostPrm': forum.submitForumPostPrm,
        'submitNewForumPost': forum.submitNewForumPost,
        'voteForumPostPrm': forum.voteForumPostPrm,
        'disactivateForumPost': forum.disactivateForumPost,
        'disactivateForumPostPrm': forum.disactivateForumPostPrm,
        'disactivateForumPostSec': forum.disactivateForumPostSec,
        'activateForumPost': forum.activateForumPost,
        'activateForumPostPrm': forum.activateForumPostPrm,
        'activateForumPostSec': forum.activateForumPostSec,
        'unauthorizeUserToPost': forum.unauthorizeUserToPost,
        'authorizeUserToPost': forum.authorizeUserToPost,
        'emphasizePost': forum.emphasizePost,
        'fadeoutPost': forum.fadeoutPost,
        'updatePostTags': forum.updatePostTags,
        'updatePostLabel': forum.updatePostLabel,
        'getUnauthorizedUsers': forum.getUnauthorizedUsers
    }
};

var pagefailAction = {
    'POST': {
        'pageFail': pagefail.pageFail
    }
};

var dataActionMapping = {
    'security': security,
    'user': userActions,
    'org': orgActions,
    'activity': activityActions,
    'admin': adminActions,
    'library': libraryActions,
    'forum': forumActions,
    'pagefail': pagefailAction
};

var router = function (pack) {
    var reqPath = url.parse(pack.req.url).pathname;
    var reqSet = reqPath.split('/');
    var method = pack.req.method;
    var ctrl = reqSet[1];
    var act = reqSet[2];
    var ret = dataActionMapping[ctrl][method][act];
    if (ret) {
        pack.req.action = ret
        return pack;
    }
    else
        throw new Error('cannot find data action for: ' + reqPath);
};

exports.router = router;
