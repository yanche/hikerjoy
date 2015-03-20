
var utility = require('utility');
var Q = require('q');
var hikerJoy = require('hikerJoy');
var dataBase = require('hikerJoy_dataBase');
var authClient = require('hikerJoy_authClient');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;
var dsHelper = require('dataServer_helper');
var objectId = require('mongodb').ObjectID;

//input: tmpUser: { 'email':, 'phone':, 'name':, 'gender': } (optional)
//input: items: [ { 'label':, 'type':, 'value': } ], sign up sheet
//input: actId, org
//output: {'returnCode':, 'msg':, 'picUrls': }
var orgActSignUp = function (pack) {
    var authInfo = pack.req.session.user;
    var actId = pack.req.body.actId, orgAlias = pack.req.body.org;
    if (actId == null || (typeof orgAlias) !== 'string' || orgAlias.trim().length === 0)
        return attachToPack(pack, getRCObj(hikerJoy.constants.signUp_rc.inputParaError));
    var tmpUser = null;
    if (!authInfo) { //no login, temp user
        tmpUser = __getTempUserInfo(pack.req.body.tmpUser);
        if (!tmpUser)
            return attachToPack(pack, getRCObj(hikerJoy.constants.signUp_rc.inputParaError));
    }
    else if(authInfo.special)
        return attachToPack(pack, getRCObj(hikerJoy.constants.signUp_rc.special));

    var items = pack.req.body.items;
    items = hikerJoy.validate.validateAndAdjustSignupSheet(items);
    if (!items)
        return attachToPack(pack, getRCObj(hikerJoy.constants.signUp_rc.inputParaError));

    var defer = new Q.defer();
    if (tmpUser)
        tmpUser.sid = pack.req.session.sessionId;

    var orgObjId = null, startsOn = null, endsOn = null, userObjId = null, actObjId = new objectId(actId), picUrls = null, activity = null;
    dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 })
    .then(function (org) {
        if (org) {
            orgObjId = org._id;
            return dataBase.getOneActFieldsBy({ '_id': actObjId }, { 'startsOn': 1, 'endsOn': 1, 'name': 1, 'organizer': 1 });
        }
        else
            throw expectedError(hikerJoy.constants.signUp_rc.actNotFound);
    })
    .then(function (act) {
        if (act)
            activity = act;
        else
            throw expectedError(hikerJoy.constants.signUp_rc.actNotFound);
    })
    .then(function () {
        //return tmp user's _id or id if has user login
        return __registerTempUserOrPassBy(tmpUser, authInfo ? authInfo._id : null);
    })
    .then(function (_id) {
        userObjId = _id; //assign the user object id
        return dataBase.getOneUserActFieldsBy({ 'userId': userObjId, 'actId': actObjId, 'statusId': {'$in': hikerJoy.constants.activeActMemberStatus } }, { '_id': 1 });
    })
    .then(function (dup) { //dup: true: dup, false: no dup
        if (dup)
            throw expectedError(hikerJoy.constants.signUp_rc.userInAnotherAct);
        else
            return dsHelper.uploadSheetImage(items);
    })
    .then(function (_picUrls) {
        picUrls = _picUrls;
        return __doSignup(userObjId, actObjId, orgObjId, items);
    })
    .then(function (userAct) {
        if (userAct) {
            if (tmpUser)
                rc = getRCObj(hikerJoy.constants.signUp_rc.successWithTempUser);
            else
                rc = getRCObj(hikerJoy.constants.signUp_rc.success);
            rc.picUrls = picUrls;
            defer.resolve(attachToPack(pack, rc));
            //add system message
            var msg = __generateMsgForSignupNotification(activity.name);
            dataBase.createUserMessage(0, userObjId, msg.subject, msg.body, false);
            __sendSignupNotificationEmail(userObjId, activity);
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.signUp_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.signUp_rc.unKnownError)));
        }
    });
    return defer.promise;
};

var __registerTempUserOrPassBy = function (tmpUser, passByWith) {
    if (!tmpUser)
        return passByWith;
    else {
        var defer = new Q.defer();
        authClient.register(tmpUser)
        .then(function (ret) {
            if (!ret)
                defer.reject(expectedError(hikerJoy.constants.signUp_rc.unKnownError));
            else if (ret.returnCode === hikerJoy.constants.register_rc.emailAlreadyExists.rc)
                defer.reject(expectedError(hikerJoy.constants.signUp_rc.tmpUserEmailExists));
            else if (ret.returnCode !== hikerJoy.constants.register_rc.success.rc)
                defer.reject(expectedError(hikerJoy.constants.signUp_rc.unKnownError));
            else {
                dataBase.getOneActiveUserFieldsBy({ 'email': tmpUser.email }, { '_id': 1 })
                .then(function (user) {
                    if (user)
                        defer.resolve(user._id);
                    else {
                        console.log('temp user not found after created. ' + tmpUser.email);
                        defer.reject(expectedError(hikerJoy.constants.signUp_rc.unKnownError));
                    }
                })
                .fail(function (err) {
                    if(!err.expected) console.log(err.stack);
                    defer.reject(expectedError(hikerJoy.constants.signUp_rc.unKnownError));
                });
            }
        })
        .fail(function (err) {
            if (!err.expected) console.log(err.stack);
            defer.reject(expectedError(hikerJoy.constants.signUp_rc.unKnownError));
        });
        return defer.promise;
    }
};

//output: inserted userAct
var __doSignup = function (userObjId, actObjId, orgObjId, sheet) {
    return dataBase.insertUserAct(userObjId, actObjId, orgObjId, sheet);
};

//return false: validation failed
var __getTempUserInfo = function (info) {
    if (!info)
        return false;

    var tmpUser = {
        'email': info.email,
        'ecp_pwd': 'unknown',
        'contact': info.email,
        'phone': info.phone,
        'name': info.name,
        'gender': info.gender
    };
    var valid = hikerJoy.validate.validateRegisterForm(tmpUser);
    if (!valid)
        return false;
    else {
        tmpUser.email = tmpUser.email.toLowerCase();
        tmpUser.contact = tmpUser.contact.toLowerCase();
        tmpUser.hash_pwd = hikerJoy.constants.defaultPwd.hash;
        return tmpUser;
    }
};

var __generateMsgForSignupNotification = function (actName) {
    var subject = '活动报名成功：' + actName;
    var body = [ {'T':'P', 'C': [
        {'T': 'text', 'V': '你可以在“'},
        {'T': 'A', 'V': hikerJoy.config.siteUrl + '/global/footprint', 'C': [ {'T': 'text', 'V': '足迹'} ] },
        {'T': 'text', 'V': '”中查看自己的报名状态，以及更新报名信息 ^^'}
    ]} ];
    return {'subject': subject, 'body': body};
};

var __sendSignupNotificationEmail = function (userObjId, activity) {
    Q.all([ dataBase.getOneActiveUserFieldsBy({'_id': userObjId}, {'personalInfo': 1, 'nickName': 1}), dataBase.getActiveUsersFieldsBy({'_id': {'$in': activity.organizer || []}}, {'personalInfo': 1, 'nickName': 1}) ])
    .then(function (data) {
        var receiver = data[0];
        activity.organizer = data[1];
        if(receiver) {
            hikerJoy.email.sendEmail({
                'toList': receiver.personalInfo.email,
                'subject': '活动 ' + activity.name + ' 报名成功！',
                'body': hikerJoy.email.formatSignupNotification(receiver, activity)
            });
        }
    })
    .fail(function (err) {
        console.log(err.stack);
    });
};

exports.orgActSignUp = orgActSignUp;
