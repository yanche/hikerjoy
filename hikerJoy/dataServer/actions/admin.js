
var orgmanagePartial = require('./admin/orgmanage.js');
exports.reactivateOrg = orgmanagePartial.reactivateOrg;
exports.disactivateOrg = orgmanagePartial.disactivateOrg;
exports.orgAliasAvailable = orgmanagePartial.orgAliasAvailable;
exports.updateOrgBasicInfo = orgmanagePartial.updateOrgBasicInfo;
exports.createNewOrg = orgmanagePartial.createNewOrg;

var toolsPartial = require('./admin/admintools.js');
exports.userInjection = toolsPartial.userInjection;
