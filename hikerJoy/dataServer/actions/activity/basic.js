
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

//input: {'orgAlias':}
//output: [{'_id','orgId':,'statusId':,'name':,'startsOn':,'endsOn':,'organizer': [ list of id ],'intro':,'createdOn':,'picUrl':,'sheet':[],'recruitmentUpdatedOn':,'billstatementUpdatedOn':,'summaryUpdatedOn':,'tags': }]
//output: not archived/removed activities, per org(ONLY ADMIN), or all orgs(ob or god)
var getAllActiveActs = function (pack) {
    var authInfo = pack.req.session.user, emptyRet = [];
    if (!authInfo)
        return attachToPack(pack, emptyRet);
    var orgAlias = pack.req.body.orgAlias;
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        orgAlias = null; //for all orgs

    var defer = new Q.defer();
    var sid = pack.req.session.sessionId;
    var authpromise = orgAlias ? authClient.authQuery.canGetOrgActiveActs({ 'org': orgAlias, 'sid': sid }) : authClient.authQuery.canGetAllActiveActs({ 'sid': sid });
    authpromise.then(function (ret) {
        if (ret && ret.auth) {
            if (orgAlias)
                return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 });
            else
                return;
        }
        else
            throw expectedError('not authorized to getAllActiveActs');
    })
    .then(function (org) {
        var fields = {
            '_id': 1, 'orgId': 1, 'statusId': 1, 'name': 1, 'startsOn': 1, 'endsOn': 1, 'organizer': 1, 'intro': 1, 'createdOn': 1,
            'picUrl': 1, 'sheet': 1, 'recruitmentUpdatedOn': 1, 'billstatementUpdatedOn': 1, 'summaryUpdatedOn': 1, 'tags': 1
        };
        if (!orgAlias)
            return dataBase.getActiveActsFieldsBy({}, fields);
        else if (org)
            return dataBase.getActiveActsFieldsBy({ 'orgId': org._id }, fields);
        else
            throw expectedError('org not found after authorized to getAllActiveActs');
    })
    .then(function (acts) {
        defer.resolve(attachToPack(pack, acts));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'orgAlias':}
//output: [{'_id','orgId':,'statusId':,'name':,'startsOn':,'endsOn':,'organizer': [ list of id ],'intro':,'createdOn':,'picUrl':,'sheet':[],'recruitmentUpdatedOn':,'billstatementUpdatedOn':,'summaryUpdatedOn':,'tags': }]
//output: not archived/removed activities, per org, or all orgs(ADMIN OR ORGANIZER)
var getAllActiveActs_MyLeadershipOrAdmin = function (pack) {
    var authInfo = pack.req.session.user, emptyRet = [];
    if (!authInfo)
        return attachToPack(pack, emptyRet);
    var orgAlias = pack.req.body.orgAlias;
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        orgAlias = null; //for all orgs

    var isGodOrOb = (authInfo.special & 1) || (authInfo.special & 2), defer = new Q.defer();
    var promises = [!isGodOrOb ? dataBase.getActiveOrgsFieldsBy({ 'admins': authInfo._id }, { '_id': 1 }) : helper.getResolvedPromise()]; //first, find org user as admin
    if (orgAlias) promises.push(dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 })); //second, find current alias org
    Q.all(promises).then(function (data) {
        var fields = { '_id': 1, 'orgId': 1, 'statusId': 1, 'name': 1, 'startsOn': 1, 'endsOn': 1, 'organizer': 1, 'intro': 1, 'createdOn': 1, 'picUrl': 1, 'sheet': 1, 'recruitmentUpdatedOn': 1, 'billstatementUpdatedOn': 1, 'summaryUpdatedOn': 1, 'tags': 1 };
        var filter = { 'statusId': { '$in': hikerJoy.constants.activeActStatus } };
        if (orgAlias) {
            if (data[1]) filter['orgId'] = data[1]._id;
            else throw expectedError('org with alias not found.' + orgAlias);
        }
        if (!isGodOrOb) { //as admin of org, or as organizer
            if (hikerJoy.validate.validateNonEmptyArray(data[0]))
                filter['$or'] = [{ 'organizer': authInfo._id }, { 'orgId': { '$in': data[0].map(function (v) { return v._id; }) } }];
            else
                filter['organizer'] = authInfo._id;
        }
        return dataBase.getActsFieldsBy(filter, fields);
    })
    .then(function (acts) {
        defer.resolve(attachToPack(pack, acts));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'orgAlias':}
//output: {'count': }
//output: not archived/removed activities, per org, or all orgs(ADMIN OR ORGANIZER)
var getAllActiveActsCount_MyLeadershipOrAdmin = function (pack) {
    var authInfo = pack.req.session.user, emptyRet = { 'count': 0 };
    if (!authInfo)
        return attachToPack(pack, emptyRet);
    var orgAlias = pack.req.body.orgAlias;
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        orgAlias = null; //for all orgs

    var isGodOrOb = (authInfo.special & 1) || (authInfo.special & 2), defer = new Q.defer();
    var promises = [!isGodOrOb ? dataBase.getActiveOrgsFieldsBy({ 'admins': authInfo._id }, { '_id': 1 }) : helper.getResolvedPromise()]; //first, find org user as admin
    if (orgAlias) promises.push(dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 })); //second, find current alias org
    Q.all(promises).then(function (data) {
        var filter = { 'statusId': { '$in': hikerJoy.constants.activeActStatus } };
        if (orgAlias) {
            if (data[1]) filter['orgId'] = data[1]._id;
            else throw expectedError('org with alias not found.' + orgAlias);
        }
        if (!isGodOrOb) { //as admin of org, or as organizer
            if (hikerJoy.validate.validateNonEmptyArray(data[0]))
                filter['$or'] = [{ 'organizer': authInfo._id }, { 'orgId': { '$in': data[0].map(function (v) { return v._id; }) } }];
            else
                filter['organizer'] = authInfo._id;
        }
        return dataBase.countActsBy(filter);
    })
    .then(function (count) {
        defer.resolve(attachToPack(pack, { 'count': count }));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

var __getActsByStatus = function (pack, statusQry) {
    var orgAlias = pack.req.body.orgAlias;
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        orgAlias = null;

    var defer = new Q.defer();
    var orgpromise = orgAlias ? dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 }) : helper.getResolvedPromise();
    orgpromise.then(function (org) {
        var fields = {
            '_id': 1, 'orgId': 1, 'statusId': 1, 'name': 1, 'startsOn': 1, 'endsOn': 1, 'organizer': 1, 'intro': 1, 'createdOn': 1,
            'picUrl': 1, 'sheet': 1, 'recruitmentUpdatedOn': 1, 'tags': 1
        };
        if (!orgAlias)
            return dataBase.getActsFieldsBy({ 'statusId': statusQry }, fields);
        else if (org)
            return dataBase.getActsFieldsBy({ 'orgId': org._id, 'statusId': statusQry }, fields);
        else
            throw expectedError('org with alias: ' + orgAlias + ' not found.');
    })
    .then(function (actsInfo) {
        if (Array.isArray(actsInfo) && actsInfo.length > 0) {
            actsInfo = actsInfo.sort(function (v1, v2) { return utility.sortByDateDesc(v1, v2, 'createdOn');}).sort(function (v1, v2) { return utility.sortByDateDesc(v1, v2, 'startsOn'); });
            var prms = actsInfo.map(function (act, k) {
                var deferGetCount = new Q.defer();
                dataBase.countUserActBy({ 'actId': act._id, 'statusId': { '$in': hikerJoy.constants.activeActMemberStatus } })
                .then(function (count) {
                    act.membersCount = count;
                    deferGetCount.resolve(act);
                })
                .fail(function (err) {
                    deferGetCount.reject(err);
                });
                return deferGetCount.promise;
            });
            return Q.all(prms);
        }
        else
            throw expectedError('no acts');
    })
    .then(function (actsInfo) {
        defer.resolve(attachToPack(pack, actsInfo));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, []));
    });
    return defer.promise;
};

//input: {'orgAlias': }
//output: [{'_id','orgId':,'statusId':,'name':,'startsOn':,'endsOn':,'organizer': [ list of id ],'intro':,'createdOn':,'picUrl':,'sheet':[],'recruitmentUpdatedOn':,'tags':,'membersCount': }]
//output: acts in open status, per org or all orgs' opening acts
//any one can access this funtionality
var getOpeningActs = function (pack) {
    return __getActsByStatus(pack, hikerJoy.constants.activityStatus.open);
};

//input: {'orgAlias': }
//output: [{'_id','orgId':,'statusId':,'name':,'startsOn':,'endsOn':,'organizer': [ list of id ],'intro':,'createdOn':,'picUrl':,'sheet':[],'recruitmentUpdatedOn':,'tags':,'membersCount': }]
//output: acts in closed or archived status
//any one can access this funtionality
var getHistoricalActs = function (pack) {
    return __getActsByStatus(pack, { '$in': hikerJoy.constants.historicalActStatus });
};

//input: {'orgAlias': if not, all orgs }
//output: [ { '_id':, 'name':, 'startsOn':, 'statusId': } ]
//any one can access this funtionality
var __getActsRecordsByStatus = function (pack, statusQry) {
    var orgAlias = pack.req.body.orgAlias, emptyRet = [];
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        orgAlias = null;

    var defer = new Q.defer();
    var orgpromise = orgAlias ? dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 }) : helper.getResolvedPromise();
    orgpromise.then(function (org) {
        var fields = { '_id': 1, 'name': 1, 'startsOn': 1, 'statusId': 1 };
        if (!orgAlias)
            return dataBase.getActsFieldsBy({ 'statusId': statusQry }, fields);
        else if (org)
            return dataBase.getActsFieldsBy({ 'orgId': org._id, 'statusId': statusQry }, fields);
        else
            throw expectedError('org with alias: ' + orgAlias + ' not found.');
    })
    .then(function (acts) {
        defer.resolve(attachToPack(pack, acts));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'orgAlias': if not, all orgs }
//output: [ { '_id':, 'name':, 'startsOn':, 'statusId': } ]
//public access
var getOpeningActsRecords = function (pack) {
    return __getActsRecordsByStatus(pack, hikerJoy.constants.activityStatus.open);
};

//input: {'orgAlias': if not, all orgs }
//output: [ { '_id':, 'name':, 'startsOn':, 'statusId': } ]
//public access
var getHistoricalActsRecords = function (pack) {
    return __getActsRecordsByStatus(pack, { '$in': [hikerJoy.constants.activityStatus.closed, hikerJoy.constants.activityStatus.archived] });
};

//input: {'orgAlias': }
//output: [{'_id','orgId':,'statusId':,'name':,'startsOn':,'endsOn':,'organizer': [ list of id ],'intro':,'createdOn':,'picUrl':,'sheet':[],'recruitmentUpdatedOn':,'billstatementUpdatedOn':,'summaryUpdatedOn':,'tags': }]
var __getMyLeadershipActivityByStatus = function (pack, statusQry) {
    var emptyRet = [], authInfo = pack.req.session.user, orgAlias = pack.req.body.orgAlias;
    if (!authInfo) return attachToPack(pack, emptyRet);
    if (!hikerJoy.validate.validateValuedString(orgAlias)) orgAlias = null;

    var isGodOrOb = (authInfo.special & 1) || (authInfo.special & 2), defer = new Q.defer();
    var orgpromise = orgAlias ? dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 }) : helper.getResolvedPromise();
    orgpromise.then(function (org) {
        var fields = { '_id': 1, 'orgId': 1, 'statusId': 1, 'name': 1, 'startsOn': 1, 'endsOn': 1, 'organizer': 1, 'intro': 1, 'createdOn': 1, 'picUrl': 1, 'sheet': 1, 'recruitmentUpdatedOn': 1, 'billstatementUpdatedOn': 1, 'summaryUpdatedOn': 1, 'tags': 1 };
        var filter = { 'statusId': statusQry };
        if (!isGodOrOb) filter['organizer'] = authInfo._id;
        if (orgAlias) {
            if (org) {
                filter['orgId'] = org._id;
                return dataBase.getActsFieldsBy(filter, fields);
            }
            else
                throw expectedError('org not found, for getMyLeadershipHistoricalActivity');
        }
        else {
            return dataBase.getActsFieldsBy(filter, fields);
        }
    })
    .then(function (acts) {
        defer.resolve(attachToPack(pack, acts));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'orgAlias': }
//output: [{'_id','orgId':,'statusId':,'name':,'startsOn':,'endsOn':,'organizer': [ list of id ],'intro':,'createdOn':,'picUrl':,'sheet':[],'recruitmentUpdatedOn':,'billstatementUpdatedOn':,'summaryUpdatedOn':,'tags': }]
var getMyLeadershipActiveActivity = function (pack) {
    return __getMyLeadershipActivityByStatus(pack, { '$in': hikerJoy.constants.activeActStatus });
};

//input: {'orgAlias': }
//output: [{'_id','orgId':,'statusId':,'name':,'startsOn':,'endsOn':,'organizer': [ list of id ],'intro':,'createdOn':,'picUrl':,'sheet':[],'recruitmentUpdatedOn':,'billstatementUpdatedOn':,'summaryUpdatedOn':,'tags': }]
var getMyLeadershipHistoricalActivity = function (pack) {
    return __getMyLeadershipActivityByStatus(pack, { '$in': hikerJoy.constants.historicalActStatus });
};

//input: {'actId':, 'recruitmentUpdatedOn': }
//output: {'_id':, 'statusId':, 'name':, 'recruitment': [{'T':, 'S':, 'V':, 'C':[]}], 'recruitmentUpdatedOn': }
//output: unremoved activity
//any one can access this funtionality
var getActRecruitment = function (pack) {
    var actId = pack.req.body.actId, recruitmentUpdatedOn = pack.req.body.recruitmentUpdatedOn, emptyRet = {};
    var actObjId = utility.tryConvert2ObjId(actId), recruitmentUpdatedOn = utility.tryConvert2Date(recruitmentUpdatedOn);
    if (!actObjId)
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer();
    dataBase.getOneUnremovedActFieldsBy({ '_id': actObjId }, { '_id': 1, 'name': 1, 'statusId': 1, 'recruitment': 1, 'recruitmentUpdatedOn': 1 })
    .then(function (act) {
        if (act) {
            if (recruitmentUpdatedOn && utility.dateEquals(act.recruitmentUpdatedOn, recruitmentUpdatedOn)) delete act.recruitment; //no update
            defer.resolve(attachToPack(pack, act));
        }
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'actId': }
//output: {'name':, 'intro':, 'picUrl': }
//output: unremoved activity
//any one can access this funtionality
var getActWeixinShareInfo = function (pack) {
    var actId = pack.req.body.actId, emptyRet = {};
    var actObjId = utility.tryConvert2ObjId(actId);
    if (!actObjId)
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer();
    dataBase.getOneUnremovedActFieldsBy({ '_id': actObjId }, { 'name': 1, 'intro': 1, 'picUrl': 1 })
    .then(function (act) {
        if (act)
            defer.resolve(attachToPack(pack, act));
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

exports.getAllActiveActs = getAllActiveActs;
exports.getAllActiveActs_MyLeadershipOrAdmin = getAllActiveActs_MyLeadershipOrAdmin;
exports.getAllActiveActsCount_MyLeadershipOrAdmin = getAllActiveActsCount_MyLeadershipOrAdmin;
exports.getOpeningActs = getOpeningActs;
exports.getHistoricalActs = getHistoricalActs;
exports.getOpeningActsRecords = getOpeningActsRecords;
exports.getHistoricalActsRecords = getHistoricalActsRecords;
exports.getMyLeadershipActiveActivity = getMyLeadershipActiveActivity;
exports.getMyLeadershipHistoricalActivity = getMyLeadershipHistoricalActivity;
exports.getActRecruitment = getActRecruitment;
exports.getActWeixinShareInfo = getActWeixinShareInfo;
