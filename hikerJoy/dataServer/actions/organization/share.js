
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

//input: {'orgAlias':, 'share': 0 or 1}
//output: {'returnCode':, 'msg': }
var setShareSummary = function (pack) {
    var orgAlias = pack.req.body.orgAlias, share = pack.req.body.share;
    share = Number(share); //should be 0 or 1
    if((typeof orgAlias) !== 'string' || orgAlias.length === 0 || isNaN(share) || (share !== 0 && share !== 1))
        return attachToPack(pack, getRCObj(hikerJoy.constants.setShareSummary_rc.inputParaError));
    if(!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.setShareSummary_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canSetOrgShareState({'sid': pack.req.session.sessionId, 'org': orgAlias})
    .then(function (ret) {
        if(ret && ret.auth)
            return dataBase.getOneActiveOrgFieldsBy({'alias': orgAlias}, {'_id': 1, 'shareSummary': 1, 'shareSummaryModifiedOn': 1});
        else
            throw expectedError(hikerJoy.constants.setShareSummary_rc.notAuth);
    })
    .then(function (org) {
        if(org) {
            var isGod = Boolean(pack.req.session.user.special & 1);
            var modifyDay = new Date(org.shareSummaryModifiedOn);
            if(!isNaN(modifyDay.getTime()))
                modifyDay.setDate(modifyDay.getDate() + 30);
            else
                modifyDay = null;
            if(org.shareSummary && share)
                throw expectedError(hikerJoy.constants.setShareSummary_rc.alreadyShare);
            else if(!org.shareSummary && !share)
                throw expectedError(hikerJoy.constants.setShareSummary_rc.alreadyNoShare);
            else if(!isGod && modifyDay && ((new Date()).getTime() - modifyDay.getTime()) < 0)
                throw expectedError(hikerJoy.constants.setShareSummary_rc.frequency);
            else { //then do share/unshare
                if(isGod)
                    return dataBase.updateOrgs({'_id': org._id}, {'$set': {'shareSummary': share}});
                else
                    return dataBase.updateOrgs({'_id': org._id}, {'$set': {'shareSummary': share, 'shareSummaryModifiedOn': new Date()}});
            }
        }
        else
            throw expectedError(hikerJoy.constants.setShareSummary_rc.orgNotFound);
    })
    .then(function (ct) {
        if(ct) {
            if(share)
                defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setShareSummary_rc.success_share)));
            else
                defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setShareSummary_rc.success_noshare)));
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setShareSummary_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setShareSummary_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias':, 'share': 0 or 1}
//output: {'returnCode':, 'msg': }
var setShareBillStatement = function (pack) {
    var orgAlias = pack.req.body.orgAlias, share = pack.req.body.share;
    share = Number(share); //should be 0 or 1
    if((typeof orgAlias) !== 'string' || orgAlias.length === 0 || isNaN(share) || (share !== 0 && share !== 1))
        return attachToPack(pack, getRCObj(hikerJoy.constants.setShareBillStatement_rc.inputParaError));
    if(!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.setShareSummary_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canSetOrgShareState({'sid': pack.req.session.sessionId, 'org': orgAlias})
    .then(function (ret) {
        if(ret && ret.auth)
            return dataBase.getOneActiveOrgFieldsBy({'alias': orgAlias}, {'_id': 1, 'shareBillStatement': 1, 'shareBillStatementModifiedOn': 1});
        else
            throw expectedError(hikerJoy.constants.setShareBillStatement_rc.notAuth);
    })
    .then(function (org) {
        if(org) {
            var isGod = Boolean(pack.req.session.user.special & 1);
            var modifyDay = new Date(org.shareBillStatementModifiedOn);
            if(!isNaN(modifyDay.getTime()))
                modifyDay.setDate(modifyDay.getDate() + 30);
            else
                modifyDay = null;
            if(org.shareBillStatement && share)
                throw expectedError(hikerJoy.constants.setShareBillStatement_rc.alreadyShare);
            else if(!org.shareBillStatement && !share)
                throw expectedError(hikerJoy.constants.setShareBillStatement_rc.alreadyNoShare);
            else if(!isGod && modifyDay && ((new Date()).getTime() - modifyDay.getTime()) < 0)
                throw expectedError(hikerJoy.constants.setShareBillStatement_rc.frequency);
            else { //then do share/unshare
                if(isGod)
                    return dataBase.updateOrgs({'_id': org._id}, {'$set': {'shareBillStatement': share}});
                else
                    return dataBase.updateOrgs({'_id': org._id}, {'$set': {'shareBillStatement': share, 'shareBillStatementModifiedOn': new Date()}});
            }
        }
        else
            throw expectedError(hikerJoy.constants.setShareBillStatement_rc.orgNotFound);
    })
    .then(function (ct) {
        if(ct) {
            if(share)
                defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setShareBillStatement_rc.success_share)));
            else
                defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setShareBillStatement_rc.success_noshare)));
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setShareBillStatement_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setShareBillStatement_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias': }
//output: {'shareSummary': , 'shareBillStatement': }
var getOrgShareStatus = function (pack) {
    var orgAlias = pack.req.body.orgAlias, emptyRet = {};
    if(!hikerJoy.validate.validateValuedString(orgAlias) || !pack.req.session.user)
        return attachToPack(pack, emptyRet);
    var defer = new Q.defer();
    authClient.authQuery.canGetOrgShareStatus({'orgAlias': orgAlias, 'sid': pack.req.session.sessionId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneActiveOrgFieldsBy({'alias': orgAlias}, {'shareSummary': 1, 'shareBillStatement': 1});
        else
            throw expectedError('not authorized to getOrgShareStatus');
    })
    .then(function (org) {
        if(org)
            defer.resolve(attachToPack(pack, {'shareSummary': org.shareSummary, 'shareBillStatement': org.shareBillStatement}));
        else
            throw expectedError('failed to retrieve data from org for getOrgShareStatus: ' + orgAlias);
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

exports.setShareSummary = setShareSummary;
exports.setShareBillStatement = setShareBillStatement;
exports.getOrgShareStatus = getOrgShareStatus;
