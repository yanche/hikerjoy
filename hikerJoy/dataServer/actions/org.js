
var adminPartial = require('./organization/admin.js');
exports.getOrgAdmin = adminPartial.getOrgAdmin;
exports.grantUserOrgAdmin = adminPartial.grantUserOrgAdmin;
exports.removeOrgAdmin = adminPartial.removeOrgAdmin;

var basicPartial = require('./organization/basic.js');
exports.getOrgContext = basicPartial.getOrgContext;
exports.uploadOrgPic = basicPartial.uploadOrgPic;

var templatePartial = require('./organization/templates.js');
exports.getOrgActTemplates = templatePartial.getOrgActTemplates;
exports.upsertOrgSignupSheetTemplate = templatePartial.upsertOrgSignupSheetTemplate;
exports.renameOrgSignupSheetTemplate = templatePartial.renameOrgSignupSheetTemplate;
exports.deleteOrgSignupSheetTemplate = templatePartial.deleteOrgSignupSheetTemplate;

var introPartial = require('./organization/intro.js');
exports.updateOrgIntro = introPartial.updateOrgIntro;
exports.getOrgIntro = introPartial.getOrgIntro;

var weixinPartial = require('./organization/weixin.js');
exports.getOrgWeixinId = weixinPartial.getOrgWeixinId;
exports.submitOrgWeixinId = weixinPartial.submitOrgWeixinId;
exports.getOrgWeixinReplies = weixinPartial.getOrgWeixinReplies;
exports.submitOrgWeixinReply = weixinPartial.submitOrgWeixinReply;
exports.archiveOrgWeixinReply = weixinPartial.archiveOrgWeixinReply;
exports.getOrgWeixinShareInfo = weixinPartial.getOrgWeixinShareInfo;
exports.getOrgWeixinKeywords = weixinPartial.getOrgWeixinKeywords;
exports.submitOrgWeixinKeyword = weixinPartial.submitOrgWeixinKeyword;

var sharePartial = require('./organization/share.js');
exports.setShareSummary = sharePartial.setShareSummary;
exports.setShareBillStatement = sharePartial.setShareBillStatement;
exports.getOrgShareStatus = sharePartial.getOrgShareStatus;
