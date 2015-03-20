
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var getRCObj = helper.getRCObj;
var attachToPack = helper.attachToPack;
var expectedError = helper.expectedError;
var objectId = require('mongodb').ObjectID;
var utility = require('utility');
var Q = require('q');

//input: {'memberIds': [], 'subject':, 'body':, 'ccOrganizer': true or false }
//output: {'returnCode':, 'msg': }
var sendEmailToActMembers = function (pack) {
    var authInfo = pack.req.session.user;
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.sendEmailToActMembers_rc.notAuth));
    var body = pack.req.body;
    var subject = body.subject, content = body.body, memberIds = hikerJoy.validate.adjustObjectIdArray(body.memberIds);
    if (!hikerJoy.validate.validateValuedString(subject) || !hikerJoy.validate.validateValuedString(content) || !hikerJoy.validate.validateNonEmptyArray(memberIds))
        return attachToPack(pack, getRCObj(hikerJoy.constants.sendEmailToActMembers_rc.inputParaError));
    subject = subject.trim(), content = content.trim();

    var defer = new Q.defer(), organizers = null, emailOption = null;
    authClient.authQuery.canSendEmailToActivityMembers({ 'sid': pack.req.session.sessionId, 'memberIdlist': memberIds })
    .then(function (ret) {
        if (ret && hikerJoy.validate.validateNonEmptyArray(ret.authList))
            return dataBase.getUserActsFieldsBy({ '_id': { '$in': hikerJoy.validate.adjustObjectIdArray(ret.authList) } }, { '_id': 1, 'userId': 1, 'actId': 1 });
        else
            throw expectedError(hikerJoy.constants.sendEmailToActMembers_rc.notAuth);
    })
    .then(function (members) {
        if (hikerJoy.validate.validateNonEmptyArray(members)) {
            var promises = [dataBase.getActiveUsersFieldsBy({ '_id': { '$in': members.map(function (v) { return v.userId; }) } }, { '_id': 1, 'personalInfo.email': 1 })];
            if (pack.req.body.ccOrganizer) {
                var actObjIds = [];
                members.forEach(function (v) {
                    if (!actObjIds.containsObjectId(v.actId))
                        actObjIds.push(v.actId);
                });
                var deferOrganizer = new Q.defer();
                dataBase.getActiveActsFieldsBy({ '_id': { '$in': actObjIds } }, { 'organizer': 1 })
                .then(function (acts) {
                    var userObjIds = [];
                    if (hikerJoy.validate.validateNonEmptyArray(acts)) {
                        acts.forEach(function (v) {
                            if (hikerJoy.validate.validateNonEmptyArray(v.organizer)) {
                                v.organizer.forEach(function (o) {
                                    if (!userObjIds.containsObjectId(o)) userObjIds.push(o);
                                });
                            }
                        });
                    };
                    return dataBase.getActiveUsersFieldsBy({ '_id': { '$in': userObjIds } }, { '_id': 1, 'personalInfo.email': 1 });
                })
                .then(function (users) {
                    deferOrganizer.resolve(users);
                })
                .fail(function (err) {
                    deferOrganizer.reject(err);
                });
                promises.push(deferOrganizer.promise);
            }
            return Q.all(promises);
        }
        else
            throw expectedError(hikerJoy.constants.sendEmailToActMembers_rc.noValidMember);
    })
    .then(function (data) {
        var users = data[0];
        if (hikerJoy.validate.validateNonEmptyArray(users)) {
            var emailList = users.map(function (v) { return v.personalInfo.email; });
            emailOption = { 'toList': emailList, 'subject': subject, 'body': hikerJoy.email.formatActMsg(content) };
            if (pack.req.body.ccOrganizer && hikerJoy.validate.validateNonEmptyArray(data[1])) {
                emailOption.ccList = data[1].map(function (v) { return v.personalInfo.email; });
            }
            dataBase.createUserMessageToMultiReceivers(0, users.map(function (v) { return v._id; }), subject, [ {'T':'text', 'V': content } ], false); //add system message for all receivers
            return hikerJoy.email.sendEmail(emailOption);
        }
        else
            throw expectedError(hikerJoy.constants.sendEmailToActMembers_rc.unKnownError);
    })
    .then(function () {
        defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.sendEmailToActMembers_rc.success)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.sendEmailToActMembers_rc.unKnownError)));
        }
    });
    return defer.promise;
};

exports.sendEmailToActMembers = sendEmailToActMembers;
