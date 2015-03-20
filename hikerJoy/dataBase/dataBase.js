
var userColAction = require('./actions/users.js');
var orgColAction = require('./actions/orgs.js');
var actColAction = require('./actions/activity.js');
var emailColAction = require('./actions/email.js');
var sessionColAction = require('./actions/session.js');
var forum = require('./actions/forum.js');
var cache = require('./actions/cache.js');

//org
exports.getOneOrgBy = orgColAction.getOneOrgBy;
exports.getOneOrgFieldsBy = orgColAction.getOneOrgFieldsBy;
exports.getOneActiveOrgBy = orgColAction.getOneActiveOrgBy;
exports.getOneActiveOrgFieldsBy = orgColAction.getOneActiveOrgFieldsBy;
exports.getOrgsBy = orgColAction.getOrgsBy;
exports.getOrgsFieldsBy = orgColAction.getOrgsFieldsBy;
exports.getActiveOrgsBy = orgColAction.getActiveOrgsBy;
exports.getActiveOrgsFieldsBy = orgColAction.getActiveOrgsFieldsBy;
exports.updateOrgs = orgColAction.updateOrgs;
exports.updateActiveOrgs = orgColAction.updateActiveOrgs;
exports.insertOneOrg = orgColAction.insertOneOrg;
exports.updateOrgBannerUrl = orgColAction.updateOrgBannerUrl;
exports.updateOrgLogoUrl = orgColAction.updateOrgLogoUrl;
exports.upsertOrgSignupSheetTemplate = orgColAction.upsertOrgSignupSheetTemplate;
exports.getOrgWeixinReplies = orgColAction.getOrgWeixinReplies;
exports.insertOneWeixinReply = orgColAction.insertOneWeixinReply;
exports.updateWeixin = orgColAction.updateWeixin;
exports.getOneOrgWeixinFieldsBy = orgColAction.getOneOrgWeixinFieldsBy;
exports.getOneOrgActiveWeixinFieldsBy = orgColAction.getOneOrgActiveWeixinFieldsBy;
exports.getOrgWeixinsFieldsBy = orgColAction.getOrgWeixinsFieldsBy;
exports.getOrgActiveWeixinsFieldsBy = orgColAction.getOrgActiveWeixinsFieldsBy;

//activity
exports.getOneActBy = actColAction.getOneActBy;
exports.getOneActFieldsBy = actColAction.getOneActFieldsBy;
exports.getOneActiveActFieldsBy = actColAction.getOneActiveActFieldsBy;
exports.getOneUnremovedActFieldsBy = actColAction.getOneUnremovedActFieldsBy;
exports.getActsBy = actColAction.getActsBy;
exports.getActsFieldsBy = actColAction.getActsFieldsBy;
exports.getActiveActsFieldsBy = actColAction.getActiveActsFieldsBy;
exports.getUnremovedActsFieldsBy = actColAction.getUnremovedActsFieldsBy;
exports.countActsBy = actColAction.countActsBy;
exports.insertOneAct = actColAction.insertOneAct;
exports.updateActs = actColAction.updateActs;
exports.getOneTag = actColAction.getOneTag;
exports.getTags = actColAction.getTags;
exports.updateAvailableTags =actColAction.updateAvailableTags;
exports.removeActs = actColAction.removeActs;
exports.getFeedbacks = actColAction.getFeedbacks

//user
exports.getOneUserBy = userColAction.getOneUserBy;
exports.getOneUserFieldsBy = userColAction.getOneUserFieldsBy;
exports.getOneActiveUserBy = userColAction.getOneActiveUserBy;
exports.getOneActiveUserFieldsBy = userColAction.getOneActiveUserFieldsBy;
exports.getUsersBy = userColAction.getUsersBy;
exports.getUsersFieldsBy = userColAction.getUsersFieldsBy;
exports.getActiveUsersBy = userColAction.getActiveUsersBy;
exports.getActiveUsersFieldsBy = userColAction.getActiveUsersFieldsBy;
exports.updateUsers = userColAction.updateUsers;
exports.updateActiveUsers = userColAction.updateActiveUsers;
exports.insertOneUser = userColAction.insertOneUser;
exports.updateUserPwd = userColAction.updateUserPwd;
exports.getUserOutMessages = userColAction.getUserOutMessages;
exports.getUserInMessages = userColAction.getUserInMessages;
exports.getUserInMessages_system = userColAction.getUserInMessages_system;
exports.getUserUnreadMsgCount = userColAction.getUserUnreadMsgCount;
exports.createUserMessage = userColAction.createUserMessage;
exports.createUserMessageToMultiReceivers = userColAction.createUserMessageToMultiReceivers;
exports.markUserMessageRead = userColAction.markUserMessageRead;
exports.markUserReceivedMessageDelete = userColAction.markUserReceivedMessageDelete;
exports.markUserSendMessageDelete = userColAction.markUserSendMessageDelete;
exports.createPwdResetTicket = userColAction.createPwdResetTicket;
exports.claimPwdResetTicket = userColAction.claimPwdResetTicket;
exports.getActivePwdResetTicket = userColAction.getActivePwdResetTicket;
exports.getUserActivePwdResetTicket = userColAction.getUserActivePwdResetTicket;
exports.checkUserDupSignup = userColAction.checkUserDupSignup;
exports.getUserActsFieldsBy = userColAction.getUserActsFieldsBy;
exports.getOneUserActFieldsBy = userColAction.getOneUserActFieldsBy;
exports.insertUserAct = userColAction.insertUserAct;
exports.getUserOrgActFootprint = userColAction.getUserOrgActFootprint;
exports.updateUserActs = userColAction.updateUserActs;
exports.replaceUserActItems = userColAction.replaceUserActItems;
exports.getActivityMembersInfo = userColAction.getActivityMembersInfo;
exports.countUserActBy = userColAction.countUserActBy;

//email
exports.insertOneEmail = emailColAction.insertOneEmail;

//session
exports.getOneSession = sessionColAction.getOneSession;
exports.getSessions = sessionColAction.getSessions;
exports.insertOneSession = sessionColAction.insertOneSession;
exports.removeSessions = sessionColAction.removeSessions;
exports.updateSessions = sessionColAction.updateSessions;

//forum
exports.getOneForumPostFieldsBy = forum.getOneForumPostFieldsBy;
exports.getOneActiveForumPostFieldsBy = forum.getOneActiveForumPostFieldsBy;
exports.getForumPostsFieldsBy = forum.getForumPostsFieldsBy;
exports.getActiveForumPostsFieldsBy = forum.getActiveForumPostsFieldsBy;
exports.getOneForumPostPrmFieldsBy = forum.getOneForumPostPrmFieldsBy;
exports.getOneActiveForumPostPrmFieldsBy = forum.getOneActiveForumPostPrmFieldsBy;
exports.getForumPostPrmsFieldsBy = forum.getForumPostPrmsFieldsBy;
exports.getActiveForumPostPrmsFieldsBy = forum.getActiveForumPostPrmsFieldsBy;
exports.getOneForumPostSecFieldsBy = forum.getOneForumPostSecFieldsBy;
exports.getOneActiveForumPostSecFieldsBy = forum.getOneActiveForumPostSecFieldsBy;
exports.getForumPostSecsFieldsBy = forum.getForumPostSecsFieldsBy;
exports.getActiveForumPostSecsFieldsBy = forum.getActiveForumPostSecsFieldsBy;
exports.insertOneForumPostSec = forum.insertOneForumPostSec;
exports.updateForumPostSecs = forum.updateForumPostSecs;
exports.insertOneForumPostPrm = forum.insertOneForumPostPrm;
exports.updateForumPostPrms = forum.updateForumPostPrms;
exports.insertOneForumPost = forum.insertOneForumPost;
exports.updateForumPosts = forum.updateForumPosts;
exports.getActiveForumPostsCount = forum.getActiveForumPostsCount;
exports.getForumPostsCount = forum.getForumPostsCount;
exports.getActiveForumPostPrmsCount = forum.getActiveForumPostPrmsCount;
exports.getForumPostPrmsCount = forum.getForumPostPrmsCount;
exports.getActiveForumPostSecsCount = forum.getActiveForumPostSecsCount;
exports.getForumPostSecsCount = forum.getForumPostSecsCount;

//cache
exports.getOneCacheInfoFieldsBy = cache.getOneCacheInfoFieldsBy;
exports.updateCacheInfo = cache.updateCacheInfo;
