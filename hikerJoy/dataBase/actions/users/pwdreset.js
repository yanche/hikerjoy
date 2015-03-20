
var Q = require('q');
var helper = require('dataBase_helper');
var collections = helper.collections;
var dataBase = require('hikerJoy_dataBase');
var utility = require('utility');

var createPwdResetTicket = function (userObjId) {
    var exp = new Date(), now = new Date();
    exp.setDate(now.getDate() + 1); //expire at next day
    return helper.insertOneDoc(collections.pwdReset, { 'userId': userObjId, 'ticketId': utility.getRandom(), 'createdOn': now, 'expiredOn': exp });
};

var claimPwdResetTicket = function (ticketId) {
    return helper.updateDocs(collections.pwdReset, { 'ticketId': ticketId }, { '$set': { 'claimedOn': new Date() } });
};

var getActivePwdResetTicket = function (ticketId) {
    //not expired, not claimed before
    return helper.getOneDoc(collections.pwdReset, { 'ticketId': ticketId, 'expiredOn': { '$gt': new Date() }, 'claimedOn': null });
};

//maybe multiple, but return one(random)
var getUserActivePwdResetTicket = function (userObjId) {
    //not expired, not claimed before
    return helper.getOneDoc(collections.pwdReset, { 'userId': userObjId, 'expiredOn': { '$gt': new Date() }, 'claimedOn': null });
};

exports.createPwdResetTicket = createPwdResetTicket;
exports.claimPwdResetTicket = claimPwdResetTicket;
exports.getActivePwdResetTicket = getActivePwdResetTicket;
exports.getUserActivePwdResetTicket = getUserActivePwdResetTicket;
