
var exp = require('hikerJoy').config.sessionExpMin;
var timer = require('timers');

var Q = require('q');
var dataBase = require('hikerJoy_dataBase');
var utility = require('utility');

var generateTokenKey = function () {
    return { 'key': utility.getRandom().toString(), 'value': utility.getRandom().toString() };
};

var createSession = function () {
    var defer = new Q.defer();
    dataBase.insertOneSession({ 'sessionId': utility.getRandomWithTimestamp(), 'lastAccessOn': new Date(), 'token': generateTokenKey() })
    .then(function (ret) {
        defer.resolve(ret);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

//input: session id
//output: that session, or null
var getSession = function (sid) {
    var defer = new Q.defer();
    dataBase.getOneSession({ 'sessionId': sid }, { 'sessionId': 1, 'user': 1, 'token': 1 })
    .then(function (sess) {
        if (sess)
            dataBase.updateSessions({ 'sessionId': sess.sessionId }, { '$set': { 'lastAccessOn': new Date() } });
        defer.resolve(sess);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

//input: session id
//output: that session, or created new session
var getOrCreateSession = function (sid) {
    var defer = new Q.defer();
    dataBase.getOneSession({ 'sessionId': sid }, { 'sessionId': 1, 'user': 1, 'token': 1 })
    .then(function (sess) {
        if (sess)
            return sess;
        else
            return createSession();
    })
    .then(function (sess) {
        dataBase.updateSessions({ 'sessionId': sess.sessionId }, { '$set': { 'lastAccessOn': new Date() } });
        defer.resolve(sess);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

//input: authInfo: {'_id':, 'email':, 'special': }
//output: added, true or false
var addUserAuthInfo2Session = function (sid, authInfo) {
    var defer = new Q.defer();
    dataBase.updateSessions({ 'sessionId': sid }, { '$set': { 'user': authInfo } })
    .then(function (ct) {
        defer.resolve(ct > 0);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

//output: removed, true or false
var removeUserAuthInfoFromSession = function (sid) {
    var defer = new Q.defer();
    dataBase.updateSessions({ 'sessionId': sid }, { '$set': { 'user': null } })
    .then(function (ct) {
        defer.resolve(ct > 0);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

var getUserInfo = function (sid) {
    var defer = new Q.defer();
    dataBase.getOneSession({ 'sessionId': sid }, { 'user': 1 })
    .then(function (sess) {
        if (sess)
            defer.resolve(sess.user);
        else
            defer.resolve(null);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

var doExpireSessions = function () {
    var lastAccess = new Date();
    lastAccess.setMinutes(lastAccess.getMinutes() - exp);
    dataBase.removeSessions({ 'lastAccessOn': { '$lt': lastAccess } })
    .then(function (ct) {
        console.log(ct + ' sessions expired');
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
    });
    expTimer();
};

var expTimer = function () {
    timer.setTimeout(doExpireSessions, 60 * 60 * 1000); //per hour
};
expTimer();

exports.getOrCreateSession = getOrCreateSession;
exports.getSession = getSession;
exports.addUserAuthInfo2Session = addUserAuthInfo2Session;
exports.removeUserAuthInfoFromSession = removeUserAuthInfoFromSession;
exports.getUserInfo = getUserInfo;
