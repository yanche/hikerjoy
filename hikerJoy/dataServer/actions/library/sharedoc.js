
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

//input: {'tag': }
//output: [ array of activity id ] order by startsOn, createdOn desc
var getSharedActivityIdListByTag = function (pack) {
    var emptyRet = [], authInfo = pack.req.session.user, tag = pack.req.body.tag;
    if (!authInfo || !hikerJoy.validate.validateValuedString(tag))
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer();
    var isGodOrOb = (authInfo.special & 1) || (authInfo.special & 2);
    authClient.authQuery.canGetSharedFeedbacks({ 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth) {
            if (!isGodOrOb) //for admin user
                return dataBase.getActiveOrgsFieldsBy({ 'admins': authInfo._id }, { '_id': 1, 'shareSummary': 1, 'shareBillStatement': 1 });
            else
                return;
        }
        else
            throw expectedError('not authorized to getSharedActivityIdListByTag');
    })
    .then(function (orgs) {
        if (isGodOrOb)  //for god and ob, no need to check act's org, just return all acts required
            return;

        if (Array.isArray(orgs) && orgs.length > 0) {
            var canGetShareSummary = orgs.filter(function (v) { return Boolean(v.shareSummary); }).length > 0;
            var canGetShareBillStatement = orgs.filter(function (v) { return Boolean(v.shareBillStatement); }).length > 0;
            //get those orgs share summary or bill statement
            if (canGetShareSummary || canGetShareBillStatement) {
                var query = { '$or': [{ 'admins': authInfo._id }]};
                if(canGetShareSummary) query['$or'].push({ 'shareSummary': 1 });
                if(canGetShareBillStatement) query['$or'].push({ 'shareBillStatement': 1 });
                return dataBase.getActiveOrgsFieldsBy(query, { '_id': 1 });
            }
            else
                return orgs.map(function (v) { return { '_id': v._id }; });
        }
        else
            throw expectedError('Authorized, but does not belong to any org admin group.');
    })
    .then(function (sharedOrgs) {
        if (isGodOrOb) {
            return dataBase.getActsFieldsBy({ 'tags': tag }, { '_id': 1 });
        }
        else {
            if (hikerJoy.validate.validateNonEmptyArray(sharedOrgs))
                sharedOrgs = sharedOrgs.map(function (v) { return v._id; });

            return dataBase.getActsFieldsBy({ 'orgId': { '$in': sharedOrgs }, 'tags': tag }, { '_id': 1 });
        }
    })
    .then(function (acts) {
        if (hikerJoy.validate.validateNonEmptyArray(acts)) {
            var idList = acts.map(function (v) { return v._id; });
            defer.resolve(attachToPack(pack, idList));
        }
        else
            throw expectedError('not acts found or no summary|billstatement is available.');
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {}
//output: {'orgs': [ {'_id':, 'alias':, 'fullName':, 'shortName':, 'createdOn':, 'statusId':, 'shareSummary':, 'shareBillStatement': } ], 'activities': [ {'_id':, 'orgId':, 'summaryUpdatedOn':, 'billstatementUpdatedOn': } ] }
var getSharingOrgs = function (pack) {
    var emptyRet = [];
    if(!pack.req.session.user) return attachToPack(pack, emptyRet);
    var defer = new Q.defer();
    authClient.authQuery.canGetSharingOrgs({'sid': pack.req.session.sessionId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return Q.all([
                dataBase.getOrgsFieldsBy({}, {'_id': 1, 'alias': 1, 'fullName': 1, 'shortName': 1, 'createdOn': 1, 'statusId': 1, 'shareSummary': 1, 'shareBillStatement': 1, }),
                dataBase.getActsFieldsBy({'statusId': {'$ne': hikerJoy.constants.activityStatus.removed}}, {'_id': 1, 'orgId': 1, 'summaryUpdatedOn': 1, 'billstatementUpdatedOn': 1 })
            ]);
        else
            throw new Error('not authorized to getSharingOrgs');
    })
    .then(function (data) {
        defer.resolve(attachToPack(pack, {'orgs': data[0], 'activities': data[1]}));
    })
    .fail(function (err) {
        console.log(err);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

exports.getSharedActivityIdListByTag = getSharedActivityIdListByTag;
exports.getSharingOrgs = getSharingOrgs;
