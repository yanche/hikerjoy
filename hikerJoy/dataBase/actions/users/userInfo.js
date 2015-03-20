
var dataBase = require('hikerJoy_dataBase');

var updateUserPwd = function (emailOrObjId, hash_pwd) {
    var filter = {};
    if ((typeof emailOrObjId) === 'string')
        filter.email = emailOrObjId;
    else
        filter._id = emailOrObjId;

    return dataBase.updateActiveUsers(filter, { '$set': { 'hash_pwd': hash_pwd } });
}

exports.updateUserPwd = updateUserPwd;
