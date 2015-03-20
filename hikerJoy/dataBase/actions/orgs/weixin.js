
var Q = require('q');
var helper = require('dataBase_helper');
var collections = helper.collections;
var hikerJoy = require('hikerJoy');
var dataBase = require('hikerJoy_dataBase');

//output: {'default':, 'auto': []}
var getOrgWeixinReplies = function (orgAlias) {
    var defer = new Q.defer();
    dataBase.getOneActiveOrgFieldsBy({'alias': orgAlias}, {'weixinDefault': 1, 'weixinWelcome': 1, '_id': 1})
    .then(function (org) {
        if(org) {
            collections.weixin.find({'orgId': org._id, 'statusId': hikerJoy.constants.weixinReplyStatus.active}).sort({'createdOn': -1}).toArray(function (err, docs) {
                if(err)
                    defer.reject(err);
                else
                    defer.resolve({'default': org.weixinDefault, 'welcome': org.weixinWelcome, 'auto': docs});
            });
        }
        else
            defer.reject(new Error('org with alias: ' + orgAlias + ' not found'));
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

var insertOneWeixinReply = function (obj) {
    if(!obj || Array.isArray(obj))
        throw new Error('invalid input for insertOneWeixinReply');
    delete obj._id;
    return helper.insertOneDoc(collections.weixin, obj);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var updateWeixin = function (filter, update) {
    if(filter && update)
        return helper.updateDocs(collections.weixin, filter, update);
    else
        throw new Error('invalid input for updateWeixin');
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneOrgWeixinFieldsBy = function (filter, fields) {
    return helper.getOneDocFields(collections.weixin, filter, fields);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneOrgActiveWeixinFieldsBy = function (filter, fields) {
    filter.statusId = hikerJoy.constants.weixinReplyStatus.active;
    return getOneOrgWeixinFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOrgWeixinsFieldsBy = function (filter, fields) {
    return helper.getDocsFields(collections.weixin, filter, fields);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOrgActiveWeixinsFieldsBy = function (filter, fields) {
    filter.statusId = hikerJoy.constants.weixinReplyStatus.active;
    return getOrgWeixinsFieldsBy(filter, fields);
};

exports.getOrgWeixinReplies = getOrgWeixinReplies;
exports.insertOneWeixinReply = insertOneWeixinReply;
exports.updateWeixin = updateWeixin;
exports.getOneOrgWeixinFieldsBy = getOneOrgWeixinFieldsBy;
exports.getOneOrgActiveWeixinFieldsBy = getOneOrgActiveWeixinFieldsBy;
exports.getOrgWeixinsFieldsBy = getOrgWeixinsFieldsBy;
exports.getOrgActiveWeixinsFieldsBy = getOrgActiveWeixinsFieldsBy;
