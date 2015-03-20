
var Q = require('q');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;
var objectId = require('mongodb').ObjectID;

//output: {'name':, 'gender':, 'phone':, 'email':, 'nickName': }
var getUserPersonalInfo = function (pack) {
    var authInfo = pack.req.session.user;
    if (!authInfo)
        return attachToPack(pack, {});

    var defer = new Q.defer();
    dataBase.getOneActiveUserFieldsBy({ '_id': authInfo._id }, { 'personalInfo': 1, 'nickName': 1 })
    .then(function (user) {
        if (user) {
            var ret = user.personalInfo;
            ret.nickName = user.nickName;
            defer.resolve(attachToPack(pack, ret));
        }
        else
            defer.resolve(attachToPack(pack, {}));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, {}));
    });
    return defer.promise;
};

//output: {'name': }
var getUserName = function (pack) {
    var authInfo = pack.req.session.user;
    var emptyRet = { 'name': '' };
    if (!authInfo)
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer();
    dataBase.getOneActiveUserFieldsBy({ '_id': authInfo._id }, { 'personalInfo.name': 1 })
    .then(function (user) {
        if (user && user.personalInfo && user.personalInfo.name)
            defer.resolve(attachToPack(pack, { 'name': user.personalInfo.name }));
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'name':, 'gender':, 'phone':, 'email':, 'nickName': }
//output: {'returnCode':, 'msg': }
var updateUserPersonalInfo = function (pack) {
    var info = pack.req.body;
    var authInfo = pack.req.session.user;
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateUserPersonalInfo_rc.userNotFound));
    if (!hikerJoy.validate.validatePersonalInfo(info))
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateUserPersonalInfo_rc.inputParaError));

    var nickName = info.nickName;
    info = {
        'name': info.name,
        'gender': info.gender,
        'phone': info.phone,
        'email': info.email.toLowerCase()
    };
    var defer = new Q.defer();
    (hikerJoy.validate.validateNickName(nickName) ? dataBase.getOneUserFieldsBy({'nickName': nickName, '_id': {'$ne': authInfo._id}}, {'_id': 1}) : helper.getResolvedPromise())
    .then(function (dupNickname) {
        if(dupNickname)
            throw expectedError(hikerJoy.constants.updateUserPersonalInfo_rc.nickNameDup);
        else {
            var updateQry = hikerJoy.validate.validateNickName(nickName) ? { '$set': { 'personalInfo': info, 'nickName': nickName } } : { '$set': { 'personalInfo': info }, '$unset': {'nickName': 1}};
            return dataBase.updateUsers({ '_id': authInfo._id }, updateQry);
        }
    })
    .then(function (ct) {
        if (ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateUserPersonalInfo_rc.success)));
        else
            throw expectedError(hikerJoy.constants.updateUserPersonalInfo_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateUserPersonalInfo_rc.unKnownError)));
        }
    });
    return defer.promise;
};

exports.getUserPersonalInfo = getUserPersonalInfo;
exports.getUserName = getUserName;
exports.updateUserPersonalInfo = updateUserPersonalInfo;
