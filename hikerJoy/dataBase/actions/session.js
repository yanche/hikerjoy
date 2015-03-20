
var Q = require('q');
var helper = require('dataBase_helper');
var collections = helper.collections;
var hikerJoy = require('hikerJoy');

var getOneSession = function (filter, fields) {
    return helper.getOneDocFields(collections.sessions, filter, fields);
};

var insertOneSession = function (session) {
    if(session && !Array.isArray(session)) {
        delete session._id;
        return helper.insertOneDoc(collections.sessions, session);
    }
    else
        throw new Error('invalid input for insertOneSession');
};

var removeSessions = function (filter) {
    if(filter)
        return helper.removeDocs(collections.sessions, filter);
    else
        throw new Error('invalid input for removeSessions');
};

var updateSessions = function (filter, update) {
    if(filter && update)
        return helper.updateDocs(collections.sessions, filter, update);
    else
        throw new Error('invalid input for updateSessions');
};

exports.getOneSession = getOneSession;
exports.insertOneSession = insertOneSession;
exports.removeSessions = removeSessions;
exports.updateSessions = updateSessions;
