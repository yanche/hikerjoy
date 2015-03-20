
var Q = require('q');
var helper = require('dataBase_helper');
var collections = helper.collections;
var mfj = require('mongo-fast-join');
var mongoJoin = new mfj();
var hikerJoy = require('hikerJoy');

//output: [{'_id':, 'subject':, 'body':, 'to':, 'createdOn':, 'emphasis':}]
var getUserOutMessages = function (senderObjId) {
    var defer = new Q.defer();
    mongoJoin.query(
        collections.userMsg,
        { 'fromId': senderObjId, 'senderDeleteOn': null },
        { '_id': 1, 'subject': 1, 'body': 1, 'toId': 1, 'createdOn': 1, 'emphasis': 1 }
    ).join({
        'joinCollection': collections.users,
        'leftKeys': ['toId'],
        'rightKeys': ['_id'],
        'newKey': 'receiver'
    }).exec(function (err, items) {
        if (err)
            defer.reject(err);
        else {
            var retArr = items.map(function (v, k) {
                return { '_id': v._id, 'subject': v.subject, 'body': v.body, 'to': v.receiver.nickName || '匿名', 'createdOn': v.createdOn, 'emphasis': v.emphasis };
            });
            defer.resolve(retArr);
        }
    });
    return defer.promise;
};

//output: [{'_id':, 'subject':, 'body':, 'from':, 'createdOn':, 'read':, 'emphasis':}]
var getUserInMessages = function (receiverObjId) {
    var defer = new Q.defer();
    mongoJoin.query(
        collections.userMsg,
        { 'toId': receiverObjId, 'receiverDeleteOn': null, 'fromId': {'$ne': 0} },
        { '_id': 1, 'subject': 1, 'body': 1, 'fromId': 1, 'createdOn': 1, 'firstReadOn': 1, 'emphasis': 1 }
    ).join({
        'joinCollection': collections.users,
        'leftKeys': ['fromId'],
        'rightKeys': ['_id'],
        'newKey': 'sender'
    }).exec(function (err, items) {
        if (err)
            defer.reject(err);
        else {
            var retArr = items.map(function (v, k) {
                return { '_id': v._id, 'subject': v.subject, 'body': v.body, 'from': v.sender.nickName || '匿名', 'createdOn': v.createdOn, 'read': Boolean(v.firstReadOn), 'emphasis': Boolean(v.emphasis) };
            });
            defer.resolve(retArr);
        }
    });
    return defer.promise;
};

var getUserInMessages_system = function (receiverObjId)
{
    var defer = new Q.defer();
    helper.getDocsFields(helper.collections.userMsg, { 'toId': receiverObjId, 'receiverDeleteOn': null, 'fromId': 0 },
        { '_id': 1, 'subject': 1, 'body': 1, 'fromId': 1, 'createdOn': 1, 'firstReadOn': 1, 'emphasis': 1 })
    .then(function (msg) {
        if(hikerJoy.validate.validateNonEmptyArray(msg)) {
            defer.resolve(msg.map(function (v) {
                return { '_id': v._id, 'subject': v.subject, 'body': v.body, 'from': '', 'createdOn': v.createdOn, 'read': Boolean(v.firstReadOn), 'emphasis': Boolean(v.emphasis) };
            }));
        }
        else
            defer.resolve([]);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

var getUserUnreadMsgCount = function (receiverObjId) {
    return helper.countDocs(collections.userMsg, { 'toId': receiverObjId, 'firstReadOn': null, 'receiverDeleteOn': null });
};

//senderObjId could be 0, means from system
var createUserMessage = function (senderObjId, receiverObjId, subject, body, emphasis) {
    return helper.insertOneDoc(collections.userMsg, { 'subject': subject, 'body': body, 'fromId': senderObjId, 'toId': receiverObjId, 'createdOn': new Date(), 'emphasis': Boolean(emphasis) });
};

//senderObjId could be 0, means from system
var createUserMessageToMultiReceivers = function (senderObjId, receiverObjIdArray, subject, body, emphasis) {
    var docs = receiverObjIdArray.map(function (v) { return { 'subject': subject, 'body': body, 'fromId': senderObjId, 'toId': v, 'createdOn': new Date(), 'emphasis': Boolean(emphasis) } });
    return helper.insertDocs(collections.userMsg, docs);
};

var markUserMessageRead = function (receiverObjId, msgObjId) {
    return helper.updateDocs(collections.userMsg, { 'toId': receiverObjId, '_id': msgObjId }, { '$set': { 'firstReadOn': new Date() } });
};

var markUserReceivedMessageDelete = function (receiverObjId, msgObjId) {
    return helper.updateDocs(collections.userMsg, { 'toId': receiverObjId, '_id': msgObjId }, { '$set': { 'receiverDeleteOn': new Date() } });
};

var markUserSendMessageDelete = function (senderObjId, msgObjId) {
    return helper.updateDocs(collections.userMsg, { 'fromId': senderObjId, '_id': msgObjId }, { '$set': { 'senderDeleteOn': new Date() } });
};

exports.getUserOutMessages = getUserOutMessages;
exports.getUserInMessages = getUserInMessages;
exports.getUserInMessages_system = getUserInMessages_system;
exports.getUserUnreadMsgCount = getUserUnreadMsgCount;
exports.createUserMessage = createUserMessage;
exports.createUserMessageToMultiReceivers = createUserMessageToMultiReceivers;
exports.markUserMessageRead = markUserMessageRead;
exports.markUserReceivedMessageDelete = markUserReceivedMessageDelete;
exports.markUserSendMessageDelete = markUserSendMessageDelete;
