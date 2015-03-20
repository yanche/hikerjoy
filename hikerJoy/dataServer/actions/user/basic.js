
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var objectId = require('mongodb').ObjectID;
var Q = require('q');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;

//output: {'email':}
//get the email from session
var getUserEmail = function (pack) {
    var info = pack.req.session.user;
    return attachToPack(pack, { 'email': info ? info.email : '' });
};

//input: {'nickName':}
//output: {'available': true or false}
var userNickNameAvailable = function (pack) { //case sensitive
    var falseRet = { 'available': false };
    if (hikerJoy.validate.validateNickName(pack.req.body.nickName)) {
        var defer = new Q.defer();
        dataBase.getOneUserFieldsBy({ 'nickName': pack.req.body.nickName }, { '_id': 1 })
        .then(function (user) {
            if (user)
                defer.resolve(attachToPack(pack, falseRet));
            else
                defer.resolve(attachToPack(pack, { 'available': true }));
        })
        .fail(function (err) {
            if (!err.expected) console.log(err.stack);
            defer.resolve(attachToPack(pack, falseRet));
        });
        return defer.promise;
    }
    else {
        return attachToPack(pack, falseRet);
    }
};

//output: {'available': true or false}
var userEmailAvailable = function (pack) { //case insensitive
    var falseRet = { 'available': false };
    if (hikerJoy.validate.validateEmail(pack.req.body.email)) {
        var defer = new Q.defer();
        dataBase.getOneUserFieldsBy({ 'email': pack.req.body.email.toLowerCase() }, { '_id': 1 })
        .then(function (user) {
            defer.resolve(attachToPack(pack, user ? falseRet : { 'available': true }));
        })
        .fail(function (err) {
            if (!err.expected) console.log(err.stack);
            defer.resolve(attachToPack(pack, falseRet));
        });
        return defer.promise;
    }
    else
        return attachToPack(pack, falseRet);
};

exports.getUserEmail = getUserEmail;
exports.userNickNameAvailable = userNickNameAvailable;
exports.userEmailAvailable = userEmailAvailable;
