
var utility = require('utility');
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var objectId = require('mongodb').ObjectID;
var Q = require('q');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;

//input: {'userActId':, 'statusId':, }
//output: {'returnCode':, 'msg':}
var updateMemberStatus = function (pack) {
    var userActObjId = utility.tryConvert2ObjId(pack.req.body.userActId), statusId = Number(pack.req.body.statusId);
    if (!userActObjId || !hikerJoy.constants.organizerUpdateMemberStatus.contains(statusId))
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateMemberStatus_rc.inputParaError));

    var defer = new Q.defer(), userObjId = null, actName = null, userCurrentStatusId = null;
    authClient.authQuery.canUpdateMemberStatus({ 'userActId': userActObjId, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneUserActFieldsBy({ '_id': userActObjId }, { 'statusId': 1, 'actId': 1, 'userId': 1 });
        else
            throw expectedError(hikerJoy.constants.updateMemberStatus_rc.notAuth);
    })
    .then(function (userAct) {
        if (userAct) {
            if (userAct.statusId === hikerJoy.constants.actMemberStatus.quit)
                throw expectedError(hikerJoy.constants.updateMemberStatus_rc.failedMemberStatus);
            else {
                userObjId = userAct.userId;
                userCurrentStatusId = userAct.statusId;
                return dataBase.getOneActFieldsBy({ '_id': userAct.actId }, { 'statusId': 1, 'name': 1 });
            }
        }
        else
            throw expectedError(hikerJoy.constants.updateMemberStatus_rc.memberNotFound);
    })
    .then(function (act) {
        if (act && act.statusId === hikerJoy.constants.activityStatus.open) {
            actName = act.name;
            return dataBase.updateUserActs({ '_id': userActObjId }, { '$set': { 'statusId': statusId } });
        }
        else
            throw expectedError(hikerJoy.constants.updateMemberStatus_rc.failedActivityStatus);
    })
    .then(function (ct) {
        if (ct) {
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateMemberStatus_rc.success)));
            var msg = __generateMsgForMemberStatusUpdate(statusId, userCurrentStatusId, actName);
            dataBase.createUserMessage(0, userObjId, msg.subject, msg.body, false);
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateMemberStatus_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateMemberStatus_rc.unKnownError)));
        }
    });
    return defer.promise;
};

var __generateMsgForMemberStatusUpdate = function (statusId, curStatusId, actName) {
    var statusName = hikerJoy.constants.actMemberStatusNames[statusId];
    var curStatusName = hikerJoy.constants.actMemberStatusNames[curStatusId];
    var subject = '你在活动 ' + actName + ' 中的状态已被从' + curStatusName + '更新为' + statusName;
    var body = [ {'T':'P', 'C': [
        {'T': 'text', 'V': subject + '，你可以在“'},
        {'T': 'A', 'V': hikerJoy.config.siteUrl + '/global/footprint', 'C': [ {'T': 'text', 'V': '足迹'} ] },
        {'T': 'text', 'V': '”中查看自己的状态'}
    ]} ];
    return {'subject': subject, 'body': body};
};

exports.updateMemberStatus = updateMemberStatus;
