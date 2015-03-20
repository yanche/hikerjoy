
var basicPartial = require('./user/basic.js');
exports.getUserEmail = basicPartial.getUserEmail;
exports.userNickNameAvailable = basicPartial.userNickNameAvailable;
exports.userEmailAvailable = basicPartial.userEmailAvailable;

var footprintPartial = require('./user/footprint.js');
exports.getUserFootprint = footprintPartial.getUserFootprint;
exports.userActQuit = footprintPartial.userActQuit;
exports.updateUserSignupSheet = footprintPartial.updateUserSignupSheet;

var personalinfoPartial = require('./user/personalinfo.js');
exports.getUserPersonalInfo = personalinfoPartial.getUserPersonalInfo;
exports.getUserName = personalinfoPartial.getUserName;
exports.updateUserPersonalInfo = personalinfoPartial.updateUserPersonalInfo;

var signupPartial = require('./user/signup.js');
exports.orgActSignUp = signupPartial.orgActSignUp;

var usermessagePartial = require('./user/userMessages.js');
exports.getUserMessages = usermessagePartial.getUserMessages;
exports.getUserUnreadMsgCount = usermessagePartial.getUserUnreadMsgCount;
exports.sendUserMessage = usermessagePartial.sendUserMessage;
exports.markUserMessageRead = usermessagePartial.markUserMessageRead;
exports.markUserReceivedMessageDelete = usermessagePartial.markUserReceivedMessageDelete;
exports.markUserSendMessageDelete = usermessagePartial.markUserSendMessageDelete;

var userleaderPartial = require('./user/userLeader.js');
exports.updateMemberStatus = userleaderPartial.updateMemberStatus;

var userSearchPartial = require('./user/userSearch.js');
exports.queryUserByNickNameOrNameOrEmail = userSearchPartial.queryUserByNickNameOrNameOrEmail;
exports.queryUserById = userSearchPartial.queryUserById;
