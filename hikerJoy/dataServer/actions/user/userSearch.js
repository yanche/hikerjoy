
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

//input: query (name or nickName or email)
//output: [ { '_id':, 'nickName':, 'name':, 'email': } ]
var queryUserByNickNameOrNameOrEmail = function (pack) {
    var emptyRet = [], query = pack.req.body.query;
    if (!hikerJoy.validate.validateValuedString(query))
        return attachToPack(pack, emptyRet);

    query = new RegExp('^' + RegExp.escape(query));
    var defer = new Q.defer();
    authClient.authQuery.canGetUsersInfo({ 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getActiveUsersFieldsBy({ '$or': [{ 'nickName': query }, { 'personalInfo.name': query }, {'personalInfo.email': query}], 'special': 0 }, { '_id': 1, 'nickName': 1, 'personalInfo.name': 1, 'personalInfo.email': 1 });
        else
            throw expectedError('not authorized to queryUserByNickNameOrNameOrEmail');
    })
    .then(function (users) {
        if (hikerJoy.validate.validateNonEmptyArray(users)) {
            users = users.map(function (v) {
                return { '_id': v._id, 'nickName': v.nickName, 'name': v.personalInfo.name, 'email': v.personalInfo.email };
            });
            defer.resolve(attachToPack(pack, users));
        }
        else {
            defer.resolve(attachToPack(pack, emptyRet));
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'userIdList': [] }
//output: [ {'_id':, 'email':, 'name': } ]
var queryUserById = function (pack) {
    var emptyRet = [], userIdList = pack.req.body.userIdList;
    if (!hikerJoy.validate.validateNonEmptyArray(userIdList))
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer();
    authClient.authQuery.canGetUsersInfo({ 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getActiveUsersFieldsBy({ '_id': {'$in': hikerJoy.validate.adjustObjectIdArray(userIdList)}, 'special': 0 }, { '_id': 1, 'personalInfo.email': 1, 'personalInfo.name': 1, 'nickName': 1 });
        else
            throw expectedError('not authorized to canGetUsersInfo');
    })
    .then(function (users) {
        if (hikerJoy.validate.validateNonEmptyArray(users)) {
            users = users.map(function (v) {
                return { '_id': v._id, 'email': v.personalInfo.email, 'name': v.personalInfo.name, 'nickName': v.nickName };
            });
            defer.resolve(attachToPack(pack, users));
        }
        else {
            defer.resolve(attachToPack(pack, emptyRet));
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

exports.queryUserByNickNameOrNameOrEmail = queryUserByNickNameOrNameOrEmail;
exports.queryUserById = queryUserById;
