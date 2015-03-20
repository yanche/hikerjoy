
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var getRCObj = helper.getRCObj;
var attachToPack = helper.attachToPack;
var expectedError = helper.expectedError;
var dsHelper = require('dataServer_helper');
var objectId = require('mongodb').ObjectID;
var utility = require('utility');
var Q = require('q');

//input: {'actId': ,'billstatement': [] }
var saveActBillStatement = function (pack) {
    var authInfo = pack.req.session.user, actId = pack.req.body.actId, billstatement = hikerJoy.validate.validateAndAdjustBillStatement(pack.req.body.billstatement);
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.saveActBillStatement_rc.notAuth));
    if (!actId || billstatement === false)  //billstatement: false means failed in validation, this value could be empty array
        return attachToPack(pack, getRCObj(hikerJoy.constants.saveActBillStatement_rc.inputParaError));

    var defer = new Q.defer();
    authClient.authQuery.canSaveActBillStatement({ 'sid': pack.req.session.sessionId, 'actId': actId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.updateActs({ '_id': new objectId(actId), 'statusId': { '$nin': [hikerJoy.constants.activityStatus.archived, hikerJoy.constants.activityStatus.removed] } }, { '$set': { 'billstatement': billstatement, 'billstatementUpdatedOn': new Date() } });
        else
            throw expectedError(hikerJoy.constants.saveActBillStatement_rc.notAuth);
    })
    .then(function (ct) {
        if (ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.saveActBillStatement_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.saveActBillStatement_rc.actNotFound)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.saveActBillStatement_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'actId': ,'summary': {} }
var saveActSummary = function (pack) {
    var authInfo = pack.req.session.user, actId = pack.req.body.actId, summary = hikerJoy.validate.validateAndAdjustActSummary(pack.req.body.summary);
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.saveActSummary_rc.notAuth));
    if (!actId || summary === false)  //Summary: false means failed in validation
        return attachToPack(pack, getRCObj(hikerJoy.constants.saveActSummary_rc.inputParaError));

    var defer = new Q.defer();
    authClient.authQuery.canSaveActSummary({ 'sid': pack.req.session.sessionId, 'actId': actId })
    .then(function (ret) {
        if (ret && ret.auth)
            return Q.all(dsHelper.uploadImageForHtmlPost(summary.details) || []);
        else
            throw expectedError(hikerJoy.constants.saveActSummary_rc.notAuth);
    })
    .then(function () {
        return dataBase.updateActs({ '_id': new objectId(actId), 'statusId': { '$nin': [hikerJoy.constants.activityStatus.archived, hikerJoy.constants.activityStatus.removed] } }, { '$set': { 'summary': summary, 'summaryUpdatedOn': new Date() } });
    })
    .then(function (ct) {
        if (ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.saveActSummary_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.saveActSummary_rc.actNotFound)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.saveActSummary_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: { 'actIdlist': [ array of actId ] }
//output: {'activityWithFeedbacks': [ {'_id':, 'orgId':, 'name':, 'startsOn':, 'endsOn':, 'organizer':, 'createdOn':, 'billstatement': [], 'billstatementUpdatedOn':, 'summary': {}, 'summaryUpdatedOn':, 'tags': } ], 'organizer': [] }
var getActivityFeedback = function (pack) {
    var actIdlist = hikerJoy.validate.adjustObjectIdArray(pack.req.body.actIdlist), emptyRet = [];
    if (!hikerJoy.validate.validateNonEmptyArray(actIdlist))
        return attachToPack(pack, emptyRet);

    var authList = null, defer = new Q.defer(), retActs = [];
    authClient.authQuery.canGetActivityFeedback({ 'sid': pack.req.session.sessionId, 'actIdlist': actIdlist })
    .then(function (authRet) { //{ 'authList': [ {'actId':, 'summary': true or false, 'billstatement': true or false } ] }
        authList = authRet.authList;
        if (!hikerJoy.validate.validateNonEmptyArray(authList))
            throw expectedError('no feedback allowed to get.');
        var allowedActIdList = hikerJoy.validate.adjustObjectIdArray(authList.map(function (v) { return v.actId; }));
        return dataBase.getUnremovedActsFieldsBy({ '_id': { '$in': allowedActIdList } },
            { '_id': 1, 'orgId': 1, 'name': 1, 'startsOn': 1, 'endsOn': 1, 'organizer': 1, 'createdOn': 1, 'billstatement': 1, 'billstatementUpdatedOn': 1, 'summary': 1, 'summaryUpdatedOn': 1, 'tags': 1 });
    })
    .then(function (acts) {
        var organizerObjIdList = [];
        acts.forEach(function (oneact) {
            var matchedAct = authList.filter(function (v) { return v.actId.toString() == oneact._id.toString(); });
            if (matchedAct.length > 0) {
                if (!matchedAct[0].summary) {
                    delete oneact.summary;
                    delete oneact.summaryUpdatedOn;
                }
                else if (!oneact.summary)
                    oneact.summary = {};
                if (!matchedAct[0].billstatement) {
                    delete oneact.billstatement;
                    delete oneact.billstatementUpdatedOn;
                }
                else if (!oneact.billstatement)
                    oneact.billstatement = [];
                retActs.push(oneact);
                organizerObjIdList = organizerObjIdList.concat(oneact.organizer || []);
            }
        });
        return dsHelper.getUserPersonalInfo(organizerObjIdList);
    })
    .then(function (users) {
        defer.resolve(attachToPack(pack, { 'activityWithFeedbacks': retActs, 'organizer': users }));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

exports.saveActBillStatement = saveActBillStatement;
exports.saveActSummary = saveActSummary;
exports.getActivityFeedback = getActivityFeedback;
