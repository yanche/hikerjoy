
var authClient = require('hikerJoy_authClient');
var hikerJoy = require('hikerJoy');
var constants = hikerJoy.constants;
var validate = hikerJoy.validate;
var Q = require('q');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var dsHelper = require('dataServer_helper');
var dataBase = require('hikerJoy_dataBase');

//input: {'sid':, 'email':, 'hash_pwd':}
//output: {'auth': true or false}
var authenticate = function (pack) {
    var ecp_pwd = pack.req.body.ecp_pwd, email = pack.req.body.email;
    if (!validate.validateValuedString(ecp_pwd) || !validate.validateEmail(email))
        return attachToPack(pack, { 'auth': false });

    var key = dsHelper.getRSAKey();
    var hash_pwd = dsHelper.toMD5(key.decrypt(ecp_pwd));
    email = email.toLowerCase();
    var defer = new Q.defer();
    authClient.authenticate({ 'sid': pack.req.session.sessionId, 'email': email, 'hash_pwd': hash_pwd })
    .then(function (ret) {
        if (ret && ret.auth)
            defer.resolve(attachToPack(pack, { 'auth': true }));
        else
            defer.resolve(attachToPack(pack, { 'auth': false }));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, { 'auth': false }));
    });
    return defer.promise;
};

//input: {'sid':, 'email':, 'hash_pwd': 'name':, 'phone':, 'contact':, 'gender':, 'nickName': }
//email/contact/hash_pwd should be in lower case
//output: {'returnCode':, 'msg':}
var register = function (pack) {
    //input validation
    var form = pack.req.body;
    if (!validate.validateRegisterForm(form))
        return attachToPack(pack, getRCObj(constants.register_rc.inputParaError));
    var key = dsHelper.getRSAKey();
    var pwd = key.decrypt(form.ecp_pwd);
    if(pwd == null)
        return attachToPack(pack, getRCObj(constants.register_rc.unKnownError));
    form.hash_pwd = dsHelper.toMD5(pwd);
    form.email = form.email.toLowerCase();
    form.contact = form.contact.toLowerCase();
    form.sid = pack.req.session.sessionId;
    delete form.ecp_pwd;
    var defer = new Q.defer();
    authClient.register(form)
    .then(function (ret) {
        defer.resolve(attachToPack(pack, ret));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, getRCObj(constants.register_rc.unKnownError)));
    });
    return defer.promise;
};

//input: {sid:, orgAlias:, actId}
//output: {auth: true or false, role:['god', 'ob', 'admin'...]}
var getRole = function (pack) {
    var defer = new Q.defer();
    authClient.getRole({ 'sid': pack.req.session.sessionId, 'orgAlias': pack.req.body.orgAlias, 'actId': pack.req.body.actId })
    .then(function (ret) {
        defer.resolve(attachToPack(pack, ret));
    }).fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, { 'auth': false }));
    });
    return defer.promise;
};

var logout = function (pack) {
    var defer = new Q.defer();
    authClient.logout({ 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        defer.resolve(attachToPack(pack, ret));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, { 'logout': false }));
    });
    return defer.promise;
};

//input: {'sid':, 'hash_originPwd':, 'hash_newPwd':}
//output: {'returnCode':, 'msg':}
var changePwd = function (pack) {
    var ecp_originPwd = pack.req.body.ecp_originPwd, ecp_newPwd = pack.req.body.ecp_newPwd;
    if (!validate.validateValuedString(ecp_originPwd) || !validate.validateValuedString(ecp_newPwd))
        return attachToPack(pack, getRCObj(constants.changePwd_rc.inputParaError));

    var key = dsHelper.getRSAKey();
    var hash_originPwd = dsHelper.toMD5(key.decrypt(ecp_originPwd));
    var hash_newPwd = dsHelper.toMD5(key.decrypt(ecp_newPwd));
    var defer = new Q.defer();
    authClient.changePwd({ 'sid': pack.req.session.sessionId, 'hash_originPwd': hash_originPwd, 'hash_newPwd': hash_newPwd })
    .then(function (ret) {
        defer.resolve(attachToPack(pack, ret));
    }).fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, getRCObj(constants.changePwd_rc.unKnownError)));
    });
    return defer.promise;
};

//input: {'email':, 'hash_pwd':}
//output: {'returnCode':, 'msg':}
var updateUserEmail = function (pack) {
    //input check
    var ecp_pwd = pack.req.body.ecp_pwd, email = pack.req.body.email;
    if (!validate.validateValuedString(ecp_pwd) || !validate.validateEmail(email))
        return attachToPack(pack, getRCObj(constants.updateUserEmail_rc.inputParaError));

    var key = dsHelper.getRSAKey();
    var hash_pwd = dsHelper.toMD5(key.decrypt(ecp_pwd));
    email = email.toLowerCase();
    var defer = new Q.defer();
    authClient.updateUserEmail({ 'sid': pack.req.session.sessionId, 'hash_pwd': hash_pwd, 'email': email })
    .then(function (ret) {
        defer.resolve(attachToPack(pack, ret));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, getRCObj(constants.updateUserEmail_rc.unKnownError)));
    });
    return defer.promise;
};

//input: {'ticketId':}
//output: {'returnCode':, 'msg':}
var claimPwdReset = function (pack) {
    var ticketId = pack.req.body.ticketId;
    if (!ticketId)
        return attachToPack(pack, getRCObj(constants.claimPwdReset_rc.fail));

    var defer = new Q.defer();
    authClient.claimPwdReset({ 'ticketId': ticketId })
    .then(function (ret) {
        defer.resolve(attachToPack(pack, ret));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, getRCObj(constants.claimPwdReset_rc.unKnownError)));
    });
    return defer.promise;
};

//input: {'email':}
//output: {'returnCode':, 'msg':, 'ticketId': }
var pwdResetRequest = function (pack) {
    var email = pack.req.body.email;
    if (!validate.validateEmail(email))
        return attachToPack(pack, getRCObj(constants.pwdResetRequest_rc.inputParaError));

    email = email.toLowerCase();
    var defer = new Q.defer();
    authClient.pwdResetRequest({ 'email': email })
    .then(function (ret) {
        if (ret) {
            if (ret.returnCode == constants.pwdResetRequest_rc.success.rc) {
                var ticketId = ret.ticketId;
                hikerJoy.email.sendEmail({
                    'toList': email,
                    'subject': '密码重置-hikerJoy',
                    'body': hikerJoy.email.formatPwdresetNotification(ticketId)
                });
            }
            delete ret.ticketId;
            defer.resolve(attachToPack(pack, ret));
        }
        else
            throw new Error('invalid authServer return for pwdResetRequest');
    }).fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, getRCObj(constants.pwdResetRequest_rc.unKnownError)));
    });
    return defer.promise;
};

exports.authenticate = authenticate;
exports.register = register;
exports.getRole = getRole;
exports.logout = logout;
exports.changePwd = changePwd;
exports.updateUserEmail = updateUserEmail;
exports.claimPwdReset = claimPwdReset;
exports.pwdResetRequest = pwdResetRequest;
