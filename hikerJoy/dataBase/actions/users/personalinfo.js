
var Q = require('q');
var collections = require('dataBase_helper').collections;
var dataBase = require('hikerJoy_dataBase');

var updateUserPersonalInfo = function (userObjId, info) {
    return dataBase.updateActiveUsers({ '_id': userObjId }, { '$set': { 'personalInfo': info } });
};

exports.updateUserPersonalInfo = updateUserPersonalInfo;
