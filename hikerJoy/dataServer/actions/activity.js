
var basicPartial = require('./activity/basic.js');
exports.getAllActiveActs = basicPartial.getAllActiveActs;
exports.getAllActiveActs_MyLeadershipOrAdmin = basicPartial.getAllActiveActs_MyLeadershipOrAdmin;
exports.getAllActiveActsCount_MyLeadershipOrAdmin = basicPartial.getAllActiveActsCount_MyLeadershipOrAdmin;
exports.getOpeningActs = basicPartial.getOpeningActs;
exports.getHistoricalActs = basicPartial.getHistoricalActs;
exports.getOpeningActsRecords = basicPartial.getOpeningActsRecords;
exports.getHistoricalActsRecords = basicPartial.getHistoricalActsRecords;
exports.getMyLeadershipActiveActivity = basicPartial.getMyLeadershipActiveActivity;
exports.getMyLeadershipHistoricalActivity = basicPartial.getMyLeadershipHistoricalActivity;
exports.getActRecruitment = basicPartial.getActRecruitment;
exports.getActWeixinShareInfo = basicPartial.getActWeixinShareInfo;

var submitPartial = require('./activity/submit.js');
exports.setOrgActArchived = submitPartial.setOrgActArchived;
exports.setOrgActRemoved = submitPartial.setOrgActRemoved;
exports.submitOrgActivity = submitPartial.submitOrgActivity;

var actMsgPartial = require('./activity/actmsg.js');
exports.sendEmailToActMembers = actMsgPartial.sendEmailToActMembers;

var feedbackPartial = require('./activity/feedback.js');
exports.saveActBillStatement = feedbackPartial.saveActBillStatement;
exports.saveActSummary = feedbackPartial.saveActSummary;
exports.getActivityFeedback = feedbackPartial.getActivityFeedback;

var membersPartial = require('./activity/member.js');
exports.getActivityMembers = membersPartial.getActivityMembers;

var tagPartial = require('./activity/tag.js');
exports.queryActivityTags = tagPartial.queryActivityTags;
exports.getAllActivityTags = tagPartial.getAllActivityTags;
