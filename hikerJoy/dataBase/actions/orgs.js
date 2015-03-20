
//basic.js
var basicPartial = require('./orgs/basic.js');
exports.getOneOrgBy = basicPartial.getOneOrgBy;
exports.getOneOrgFieldsBy = basicPartial.getOneOrgFieldsBy;
exports.getOneActiveOrgBy = basicPartial.getOneActiveOrgBy;
exports.getOneActiveOrgFieldsBy = basicPartial.getOneActiveOrgFieldsBy;
exports.getOrgsBy = basicPartial.getOrgsBy;
exports.getOrgsFieldsBy = basicPartial.getOrgsFieldsBy;
exports.getActiveOrgsBy = basicPartial.getActiveOrgsBy;
exports.getActiveOrgsFieldsBy = basicPartial.getActiveOrgsFieldsBy;
exports.updateOrgs = basicPartial.updateOrgs;
exports.updateActiveOrgs = basicPartial.updateActiveOrgs;
exports.insertOneOrg = basicPartial.insertOneOrg;

//picture.js
var picturePartial = require('./orgs/picture.js');
exports.updateOrgBannerUrl = picturePartial.updateOrgBannerUrl;
exports.updateOrgLogoUrl = picturePartial.updateOrgLogoUrl;

//templates.js
var templatePartial = require('./orgs/templates.js');
exports.upsertOrgSignupSheetTemplate = templatePartial.upsertOrgSignupSheetTemplate;

//weixin.js
var weixinPartial = require('./orgs/weixin.js');
exports.getOrgWeixinReplies = weixinPartial.getOrgWeixinReplies;
exports.insertOneWeixinReply = weixinPartial.insertOneWeixinReply;
exports.updateWeixin = weixinPartial.updateWeixin;
exports.getOneOrgWeixinFieldsBy = weixinPartial.getOneOrgWeixinFieldsBy;
exports.getOneOrgActiveWeixinFieldsBy = weixinPartial.getOneOrgActiveWeixinFieldsBy;
exports.getOrgWeixinsFieldsBy = weixinPartial.getOrgWeixinsFieldsBy;
exports.getOrgActiveWeixinsFieldsBy = weixinPartial.getOrgActiveWeixinsFieldsBy;
