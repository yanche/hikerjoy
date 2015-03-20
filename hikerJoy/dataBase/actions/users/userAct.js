
var Q = require('q');
var utility = require('utility');
var helper = require('dataBase_helper')
var collections = helper.collections;
var hikerJoy = require('hikerJoy');
var dataBase = require('hikerJoy_dataBase');
var mfj = require('mongo-fast-join');
var mongoJoin = new mfj();

//output: true: dup, false: no dup
var checkUserDupSignup = function (userObjId, orgObjId, timeSpanStart, timeSpanEnd) {
    if (userObjId == null || orgObjId == null || timeSpanStart == null || timeSpanEnd == null
         || isNaN((new Date(timeSpanStart)).getTime())
         || isNaN((new Date(timeSpanEnd)).getTime())
         || (new Date(timeSpanStart)).getTime() > (new Date(timeSpanEnd)).getTime())
        throw new Error('invalid input in dataBase/actions/users/userAct.js --- checkUserDupSignup');

    timeSpanStart = new Date(timeSpanStart); //null -> 1970/1/1, {} -> invalid date, Date -> Date
    timeSpanEnd = new Date(timeSpanEnd);

    var defer = new Q.defer();
    dataBase.getActsFieldsBy(
        { 'orgId': orgObjId, 'startsOn': { '$lte': timeSpanEnd }, 'endsOn': { '$gte': timeSpanStart }, 'statusId': hikerJoy.constants.activityStatus.open },
        { '_id': 1 }
    )
    .then(function (acts) {
        if (!Array.isArray(acts))
            acts = [];
        else {
            acts = acts.map(function (v, k) {
                return v._id;
            });
        } //acts: array of act._id
        return getUserActsFieldsBy(
            { 'userId': userObjId, 'orgId': orgObjId, 'actId': { '$in': acts }, 'statusId': { '$in': hikerJoy.constants.activeActMemberStatus } },
            { '_id': 1 }
        );
    })
    .then(function (dup) {
        if (Array.isArray(dup) && dup.length == 0)
            defer.resolve(false);
        else
            defer.resolve(true);
    })
    .fail(function (err) {
        console.log('err');
        console.log(err.stack);
        defer.reject(err);
    });
    return defer.promise;
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getUserActsFieldsBy = function (filter, fields) {
    return helper.getDocsFields(collections.userActs, filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneUserActFieldsBy = function (filter, fields) {
    return helper.getOneDocFields(collections.userActs, filter, fields);
};

//output: inserted userAct
var insertUserAct = function (userObjId, actObjId, orgObjId, sheet) {
    return helper.insertOneDoc(collections.userActs, {
        'userId': userObjId,
        'actId': actObjId,
        'orgId': orgObjId,
        'statusId': hikerJoy.constants.actMemberStatus.queued,
        'signUpOn': new Date(),
        'items': sheet
    });
};

//output: { 'history': [], 'active': [] }
var getUserOrgActFootprint = function (userObjId, orgObjId) {
    var defer = new Q.defer();
    var qry = orgObjId ? { 'userId': userObjId, 'orgId': orgObjId } : { 'userId': userObjId };
    mongoJoin.query(
        collections.userActs,
        qry,
        { '_id': 1, 'actId': 1, 'statusId': 1, 'signUpOn': 1, 'items': 1 }
    ).join({
        'joinCollection': collections.acts,
        'leftKeys': ['actId'],
        'rightKeys': ['_id'],
        'newKey': 'activity'
    }).exec(function (err, items) {
        if (err)
            defer.reject(err);
        else {
            var history = [], active = [];
            items.forEach(function (v, k) {
                var footprintObj = { 'userActId': v._id, 'actStatusId': v.activity.statusId, 'actId': v.actId, 'actName': v.activity.name, 'actIntro': v.activity.intro, 'actPicUrl': v.activity.picUrl, 'orgId': v.activity.orgId, 'organizers': v.activity.organizers, 'startsOn': v.activity.startsOn, 'endsOn': v.activity.endsOn, 'memberStatusId': v.statusId, 'memberSignupOn': v.signUpOn };
                if (!v || !v.activity)
                    return;
                else if (hikerJoy.constants.inactiveActMemberStatus.contains(v.statusId) || v.activity.statusId != hikerJoy.constants.activityStatus.open)
                    history.push(footprintObj);
                else {
                    footprintObj['items'] = v.items;
                    footprintObj['sheet'] = v.activity.sheet;
                    active.push(footprintObj);
                }
            });
            defer.resolve({ 'history': history, 'active': active });
        }
    });
    return defer.promise;
};

//output: count of updated documents
var updateUserActs = function (filter, update) {
    if(filter && update)
        return helper.updateDocs(collections.userActs, filter, update);
    else
        throw new Error('invalid input for updateUserActs');
    return helper.updateDocs(collections.userActs, filter, update);
};

//output: count of updated documents
var replaceUserActItems = function (userActObjId, items) {
    return helper.updateDocs(collections.userActs, { '_id': userActObjId }, { '$set': { 'items': items } });
};

//output: [ {'userId':, 'memberId':, 'statusId':, 'signUpOn':, 'personalInfo':, 'nickName':, 'items': } ]
var getActivityMembersInfo = function (actObjId) {
    var defer = new Q.defer();
    mongoJoin.query(
        collections.userActs,
        { 'actId': actObjId },
        { '_id': 1, 'userId': 1, 'statusId': 1, 'signUpOn': 1, 'items': 1 }
    ).join({
        'joinCollection': collections.users,
        'leftKeys': ['userId'],
        'rightKeys': ['_id'],
        'newKey': 'user'
    }).exec(function (err, items) {
        if (err)
            defer.reject(err);
        else {
            if (Array.isArray(items) && items.length > 0) {
                var ret = items.map(function (v, k) {
                    return { 'userId': v.userId, 'memberId': v._id, 'statusId': v.statusId, 'signUpOn': v.signUpOn, 'personalInfo': v.user.personalInfo, 'nickName': v.user.nickName, 'items': v.items };
                });
                defer.resolve(ret);
            }
            else
                defer.resolve([]);
        }
    });
    return defer.promise;
};

var countUserActBy = function (filter) {
    return helper.countDocs(collections.userActs, filter);
};

exports.checkUserDupSignup = checkUserDupSignup;
exports.getUserActsFieldsBy = getUserActsFieldsBy;
exports.getOneUserActFieldsBy = getOneUserActFieldsBy;
exports.insertUserAct = insertUserAct;
exports.getUserOrgActFootprint = getUserOrgActFootprint;
exports.updateUserActs = updateUserActs;
exports.replaceUserActItems = replaceUserActItems;
exports.getActivityMembersInfo = getActivityMembersInfo;
exports.countUserActBy = countUserActBy;
