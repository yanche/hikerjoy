
var dataBase = require('hikerJoy_dataBase');
var Q = require('q');
var session = require('./session.js');
var log = require('hikerJoy_logClient');
var hikerJoy = require('hikerJoy');
var constants = hikerJoy.constants;
var helper = hikerJoy.helper;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;
var rsa = require('hikerJoy_rsa');
var objectId = require('mongodb').ObjectID;
var utility = require('utility');

//input: {'sid':, 'email':, 'hash_pwd':}
//both email and hash_pwd for input should be in lower case
//output: {'auth': true or false}
var authenticate = function (req) {
    var defer = new Q.defer();
    dataBase.getOneActiveUserFieldsBy({ 'email': req.email, 'hash_pwd': req.hash_pwd }, { '_id': 1, 'email': 1, 'special': 1 })
    .then(function (user) {
        if (user)
            return session.addUserAuthInfo2Session(req.sid, { '_id': user._id, 'email': user.email, 'special': user.special });
        else
            throw expectedError('failed to authenticate user: ' + req.email);
    })
    .then(function (added) {
        if (added)
            defer.resolve({ 'auth': true });
        else {
            console.log('failed to add user info to session: ' + req.sid);
            defer.resolve({ 'auth': false });
        }
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    })
    return defer.promise
};

//input: {'sid':, 'email':, 'hash_pwd': 'name':, 'phone':, 'contact':, 'gender':, 'nickName':}
//email/contact/hash_pwd should be in lower case
//output: {'returnCode':, 'msg':}
var register = function (req) {
    var defer = new Q.defer();
    req.email = req.email.trim().toLowerCase();
    dataBase.getOneUserFieldsBy({ 'email': req.email }, { '_id': 1 })
    .then(function (user) {
        if (user)
            throw expectedError(constants.register_rc.emailAlreadyExists);
        else
            return hikerJoy.validate.validateNickName(req.nickName) ? dataBase.getOneUserFieldsBy({ 'nickName': req.nickName }, { '_id': 1 }) : helper.getResolvedPromise();
    })
    .then(function (nickNameDup) {
        if (nickNameDup)
            throw expectedError(constants.register_rc.nickNameDup);
        else {
            var newUser = hikerJoy.user.createPlainUser(req.email, req.hash_pwd);
            newUser.personalInfo = {
                'name': req.name,
                'phone': req.phone,
                'email': req.contact,
                'gender': req.gender
            };
            if(hikerJoy.validate.validateNickName(req.nickName))
                newUser.nickName = req.nickName;
            newUser.lastLoginOn = new Date();
            return dataBase.insertOneUser(newUser);
        }
    })
    .then(function (ret) {
        return session.addUserAuthInfo2Session(req.sid, { '_id': ret._id, 'email': ret.email, 'special': ret.special });
    })
    .then(function (added) {
        if (added)
            defer.resolve(getRCObj(constants.register_rc.success));
        else
            defer.resolve(getRCObj(constants.register_rc.unKnownError));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(getRCObj(err.hikerJoy_ret));
        else {
            console.log(err.stack);
            defer.resolve(getRCObj(constants.register_rc.unKnownError));
        }
    });
    return defer.promise;
};

//input: {'sid':}
//output: {'logout': true or false}
var logout = function (req) {
    var defer = new Q.defer();
    session.removeUserAuthInfoFromSession(req.sid)
    .then(function (removed) {
        if (removed)
            defer.resolve({ 'logout': true });
        else
            defer.resolve({ 'logout': false });
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve({ 'logout': false });
    });
    return defer.promise;
};

//input: {'sid':, 'hash_originPwd':, 'hash_newPwd':}
//both email and hash_originPwd, hash_newPwd for input should be in lower case
//output: {'returnCode':, 'msg':}
var changePwd = function (req) {
    var defer = new Q.defer();
    var email = null, hash_originPwd = req.hash_originPwd, hash_newPwd = req.hash_newPwd;
    session.getUserInfo(req.sid)
    .then(function (info) {
        if (info) {
            email = info.email;
            return dataBase.getOneActiveUserFieldsBy({ 'email': email }, { 'hash_pwd': 1 });
        }
        else
            throw expectedError(constants.changePwd_rc.userNotFound);
    })
    .then(function (user) {
        if (!user)
            throw expectedError(constants.changePwd_rc.userNotFound);
        else if (user.hash_pwd !== hash_originPwd)
            throw expectedError(constants.changePwd_rc.pwdNotMatch);
        else {
            return dataBase.updateUserPwd(email, hash_newPwd);
        }
    })
    .then(function (ct) {  //ct: the count of updated doc, should be 1
        if (ct)
            defer.resolve({ 'returnCode': hikerJoy.constants.changePwd_rc.success.rc, 'msg': hikerJoy.constants.changePwd_rc.success.msg });
        else
            throw expectedError(constants.changePwd_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(getRCObj(err.hikerJoy_ret));
        else {
            console.log(err.stack);
            defer.resolve(getRCObj(constants.changePwd_rc.unKnownError));
        }
    });
    return defer.promise;
};

//input: {'sid':, 'email':, 'hash_pwd':}
//output: {'returnCode':, 'msg':}
var updateUserEmail = function (req) {
    var originEmail = null, newEmail = req.email, hash_pwd = req.hash_pwd, userAuthInfo = null;
    var defer = new Q.defer();
    session.getUserInfo(req.sid)
    .then(function (info) {
        if (info) {
            originEmail = info.email;
            userAuthInfo = info;
            if (originEmail == newEmail)
                throw expectedError(constants.updateUserEmail_rc.noChange);
            else
                return Q.all([dataBase.getOneActiveUserFieldsBy({ 'email': originEmail }, { '_id': 1, 'hash_pwd': 1 }), dataBase.getOneUserFieldsBy({ 'email': newEmail }, { '_id': 1 })]);
        }
        else
            throw expectedError(constants.updateUserEmail_rc.userNotFound);
    })
    .then(function (vals) {
        var self = vals[0], other = vals[1];
        if (!self) //should be inactive user
            throw expectedError(constants.updateUserEmail_rc.userNotFound);
        else if (self.hash_pwd !== hash_pwd)
            throw expectedError(constants.updateUserEmail_rc.pwdNotMatch);
        else if (other)
            throw expectedError(constants.updateUserEmail_rc.emailDuplicate);
        else
            return dataBase.updateActiveUsers({'_id': self._id}, { '$set': { 'email': newEmail } });
    })
    .then(function (ct) {
        if (ct)
            return session.addUserAuthInfo2Session(req.sid, { '_id': userAuthInfo._id, 'email': newEmail, 'special': userAuthInfo.special });
        else
            throw expectedError(constants.updateUserEmail_rc.unKnownError);
    })
    .then(function (changed) {
        if (changed)
            defer.resolve(getRCObj(constants.updateUserEmail_rc.success));
        else
            defer.resolve(getRCObj(constants.updateUserEmail_rc.unKnownError));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(getRCObj(err.hikerJoy_ret));
        else {
            console.log(err.stack);
            defer.resolve(getRCObj(constants.updateUserEmail_rc.unKnownError));
        }
    });
    return defer.promise;
};

//input: {'ticketId':}
//output: {'returnCode':, 'msg':}
var claimPwdReset = function (req) {
    var ticketId = req.ticketId;
    var userObjId = null;

    var defer = new Q.defer();
    dataBase.getActivePwdResetTicket(String(ticketId))
    .then(function (tk) {
        if (tk) {
            userObjId = tk.userId;
            return tk.ticketId;
        }
        else
            throw expectedError(constants.claimPwdReset_rc.fail);
    })
    .then(function (tkid) {
        return dataBase.claimPwdResetTicket(tkid);
    })
    .then(function (ct) {
        if (ct)
            return dataBase.updateUserPwd(userObjId, constants.defaultPwd.hash);
        else
            throw expectedError(constants.claimPwdReset_rc.unKnownError);
    })
    .then(function (ct) {
        if (ct) {
            defer.resolve(getRCObj(constants.claimPwdReset_rc.success));
            dataBase.createUserMessage(0, userObjId, '密码重置', [{'T':'text', 'V':'注意：你的ID已于' + (new Date()).format('yyyy/MM/dd hh:mm:ss') + '成功重置了密码，请尽快修改密码！'}], false);
        }
        else {
            console.log('attention! no password updated after ticket claimed, userObjId: ' + userObjId);
            throw expectedError(constants.claimPwdReset_rc.unKnownError);
        }
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(getRCObj(err.hikerJoy_ret));
        else {
            console.log(err.stack);
            defer.resolve(getRCObj(constants.claimPwdReset_rc.unKnownError));
        }
    });
    return defer.promise;
};

//input: {'email':}
//output: {'returnCode':, 'msg':, 'ticketId': }
var pwdResetRequest = function (req) {
    var defer = new Q.defer();
    var email = req.email;
    var userObjId = null;
    dataBase.getOneActiveUserFieldsBy({ 'email': email }, { '_id': 1 })
    .then(function (user) {
        if (user) {
            userObjId = user._id;
            return dataBase.getUserActivePwdResetTicket(userObjId);
        }
        else
            throw expectedError(constants.pwdResetRequest_rc.userNotFound);
    })
    .then(function (ticket) {
        if (ticket)
            throw expectedError(constants.pwdResetRequest_rc.activeRequest);
        else
            return dataBase.createPwdResetTicket(userObjId);
    })
    .then(function (newTicket) {
        if (newTicket) {
            var ret = getRCObj(constants.pwdResetRequest_rc.success);
            ret.ticketId = newTicket.ticketId;
            defer.resolve(ret);
        }
        else
            throw expectedError(constants.pwdResetRequest_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(getRCObj(err.hikerJoy_ret));
        else {
            console.log(err.stack);
            defer.resolve(getRCObj(constants.pwdResetRequest_rc.unKnownError));
        }
    });
    return defer.promise;
};

var rsaKey = null;
//output: {'n':, 'e':, 'd': }
var getRSA = function () {
    if (rsaKey == null) {
        console.log('RSA key generating...');
        rsaKey = rsa.generateRSA();
        console.log('RSA key generated.');
    }

    return { 'n': rsaKey.n.toString(16), 'e': rsaKey.e.toString(16), 'd': rsaKey.d.toString(16) };
};

//input: {'sid':, 'target': }
//output: {'returnCode':, 'msg': }
var userInjection = function (req) {
    if (!hikerJoy.validate.validateEmail(req.target)) {
        var targetObjIdOrEmail = utility.tryConvert2ObjId(req.target);
        if (!targetObjIdOrEmail)
            return getRCObj(constants.userInjection_rc.unKnownError);
    }
    else
        var targetObjIdOrEmail = req.target;

    var sid = req.sid, defer = new Q.defer();
    session.getUserInfo(sid)
    .then(function (info) {
        if (!info)
            throw expectedError(constants.userInjection_rc.notAuth);
        else if (info.special & 1)
            return dataBase.getOneActiveUserFieldsBy({ '$or': [{ 'email': targetObjIdOrEmail }, { '_id': targetObjIdOrEmail }] }, { '_id': 1, 'email': 1, 'special': 1 });
        else
            throw expectedError(constants.userInjection_rc.notAuth);
    })
    .then(function (user) {
        if (user)
            return session.addUserAuthInfo2Session(sid, { '_id': user._id, 'email': user.email, 'special': user.special });
        else
            defer.resolve(getRCObj(constants.userInjection_rc.userNotFound));
    })
    .then(function (injected) {
        if (injected)
            defer.resolve(getRCObj(constants.userInjection_rc.success));
        else
            defer.resolve(getRCObj(constants.userInjection_rc.unKnownError));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(getRCObj(err.hikerJoy_ret));
        else {
            console.log(err.stack);
            defer.resolve(getRCObj(constants.userInjection_rc.unKnownError));
        }
    });
    return defer.promise;
};

exports.authenticate = authenticate;
exports.register = register;
exports.logout = logout;
exports.changePwd = changePwd;
exports.updateUserEmail = updateUserEmail;
exports.claimPwdReset = claimPwdReset;
exports.pwdResetRequest = pwdResetRequest;
exports.getRSA = getRSA;
exports.userInjection = userInjection;
