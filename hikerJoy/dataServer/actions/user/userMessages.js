
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var objectId = require('mongodb').ObjectID;
var Q = require('q');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;

//output: send: [{'_id':, 'subject':, 'body':, 'to':, 'createdOn':, 'emphasis':}]
//output: recv: [{'_id':, 'subject':, 'body':, 'from':, 'createdOn':, 'read':, 'emphasis':}]
var getUserMessages = function (pack) {
    var emptyRet = { 'send': [], 'recv': [] };
    var info = pack.req.session.user;
    if (!info)
        return attachToPack(pack, emptyRet);
    var defer = new Q.defer();
    Q.all([dataBase.getUserInMessages(info._id), dataBase.getUserOutMessages(info._id), dataBase.getUserInMessages_system(info._id)])
    .then(function (vals) {
        var recv = vals[0], send = vals[1], recv_sys = vals[2];
        defer.resolve(attachToPack(pack, { 'send': send, 'recv': recv, 'recv_sys': recv_sys }));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//output: {'count': 0}
var getUserUnreadMsgCount = function (pack) {
    var emptyRet = { 'count': 0 };
    var info = pack.req.session.user;
    if (!info)
        return attachToPack(pack, emptyRet);
    var defer = new Q.defer();
    dataBase.getUserUnreadMsgCount(info._id)
    .then(function (ct) {
        defer.resolve(attachToPack(pack, { 'count': ct }));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'toNickName':, 'subject':, 'body':, 'emphasis':}
//output: {'returnCode':, 'msg':}
var sendUserMessage = function (pack) {
    var toNickName = pack.req.body.toNickName, subject = pack.req.body.subject, body = pack.req.body.body, emphasis = pack.req.body.emphasis;
    //cehck input parameters
    if (!validateUserMessage(toNickName, subject, body))
        return attachToPack(pack, getRCObj(hikerJoy.constants.sendUserMessage_rc.inputParaError));

    var info = pack.req.session.user;
    if (!info)
        return attachToPack(pack, getRCObj(hikerJoy.constants.sendUserMessage_rc.senderNotFound));

    var defer = new Q.defer();
    //nick name is case sensitive, while user email is not case sensitive
    Q.all([dataBase.getOneActiveUserFieldsBy({ 'nickName': toNickName }, { '_id': 1, 'nickName': 1 }), dataBase.getOneActiveUserFieldsBy({ 'email': info.email }, { '_id': 1, 'nickName': 1 })])
    .then(function (vals) {
        var receiver = vals[0], sender = vals[1];
        if (!receiver)
            throw expectedError(hikerJoy.constants.sendUserMessage_rc.receiverNotFound);
        else if (!sender) //this case should not happen!
            throw expectedError(hikerJoy.constants.sendUserMessage_rc.senderNotFound);
        else if (sender.nickName == null)//null or undefined
            throw expectedError(hikerJoy.constants.sendUserMessage_rc.senderNoNickName);
        else if (sender.nickName === receiver.nickName) //cannot send to self
            throw expectedError(hikerJoy.constants.sendUserMessage_rc.noSendToSelf);
        else
            return dataBase.createUserMessage(sender._id, receiver._id, subject, body, emphasis == 'true');
    })
    .then(function (msg) {
        var ret = getRCObj(hikerJoy.constants.sendUserMessage_rc.success);
        ret.msgId = msg._id;
        defer.resolve(attachToPack(pack, ret));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.sendUserMessage_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'msgId': }
var markUserMessageRead = function (pack) {
    var info = pack.req.session.user;
    if (!info)
        return pack; //silent fail

    var defer = new Q.defer();
    dataBase.markUserMessageRead(new objectId(info._id), new objectId(pack.req.body.msgId))
    .then(function (ct) {
        defer.resolve(attachToPack(pack, {}));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, {}));
    });
    return defer.promise;
};

//input: {'msgId': }
var markUserReceivedMessageDelete = function (pack) {
    var info = pack.req.session.user;
    if (!info)
        return pack; //silent fail

    var defer = new Q.defer();
    dataBase.markUserReceivedMessageDelete(new objectId(info._id), new objectId(pack.req.body.msgId))
    .then(function (ct) {
        defer.resolve(attachToPack(pack, {}));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, {}));
    });
    return defer.promise;
};

//input: {'msgId': }
var markUserSendMessageDelete = function (pack) {
    var info = pack.req.session.user;
    if (!info)
        return pack; //silent fail

    var defer = new Q.defer();
    dataBase.markUserSendMessageDelete(new objectId(info._id), new objectId(pack.req.body.msgId))
    .then(function (ct) {
        defer.resolve(attachToPack(pack, {}));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, {}));
    });
    return defer.promise;
};

var validateUserMessage = function (toNickName, subject, body) {
    return hikerJoy.validate.validateNickName(toNickName) && hikerJoy.validate.validateValuedString(subject) && hikerJoy.validate.validateValuedString(body);
};

exports.getUserMessages = getUserMessages;
exports.getUserUnreadMsgCount = getUserUnreadMsgCount;
exports.sendUserMessage = sendUserMessage;
exports.markUserMessageRead = markUserMessageRead;
exports.markUserReceivedMessageDelete = markUserReceivedMessageDelete;
exports.markUserSendMessageDelete = markUserSendMessageDelete;
