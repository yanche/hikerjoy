
var Q = require('q');
var helper = require('dataBase_helper');
var collections = helper.collections;
var hikerJoy = require('hikerJoy');

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getOneUserBy = function (filter) {
    return helper.getOneDoc(collections.users, filter);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneUserFieldsBy = function (filter, fields) {
    return helper.getOneDocFields(collections.users, filter, fields);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getOneActiveUserBy = function (filter) {
    filter.statusId = hikerJoy.constants.userStatus.active;
    return getOneUserBy(filter);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneActiveUserFieldsBy = function (filter, fields) {
    filter.statusId = hikerJoy.constants.userStatus.active;
    return getOneUserFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getUsersBy = function (filter) {
    return helper.getDocs(collections.users, filter);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getUsersFieldsBy = function (filter, fields) {
    return helper.getDocsFields(collections.users, filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getActiveUsersBy = function (filter) {
    filter.statusId = hikerJoy.constants.userStatus.active;
    return getUsersBy(filter);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getActiveUsersFieldsBy = function (filter, fields) {
    filter.statusId = hikerJoy.constants.userStatus.active;
    return getUsersFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be update object
var updateUsers = function (filter, update) {
    if(filter && update)
        return helper.updateDocs(collections.users, filter, update);
    else
        throw new Error('invalid input for updateUsers');
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be update object
var updateActiveUsers = function (filter, update) {
    filter.statusId = hikerJoy.constants.userStatus.active;
    return updateUsers(filter, update);
};

var insertOneUser = function (user) {
    if(user && !Array.isArray(user)) {
        delete user._id;
        return helper.insertOneDoc(collections.users, user);
    }
    else
        throw new Error('invalid input for insertOneUser');
};

exports.getOneUserBy = getOneUserBy;
exports.getOneUserFieldsBy = getOneUserFieldsBy;
exports.getOneActiveUserBy = getOneActiveUserBy;
exports.getOneActiveUserFieldsBy = getOneActiveUserFieldsBy;
exports.getUsersBy = getUsersBy;
exports.getUsersFieldsBy = getUsersFieldsBy;
exports.getActiveUsersBy = getActiveUsersBy;
exports.getActiveUsersFieldsBy = getActiveUsersFieldsBy;
exports.updateUsers = updateUsers;
exports.updateActiveUsers = updateActiveUsers;
exports.insertOneUser = insertOneUser;


