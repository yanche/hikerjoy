
var Q = require('q');
var hikerJoy = require('hikerJoy');
var helper = require('dataBase_helper');

var getOneCacheInfoFieldsBy = function (filter, fields) {
    return helper.getOneDocFields(helper.collections.cacheInfo, filter, fields);
};

var updateCacheInfo = function (filter, update) {
    if(filter && update)
        return helper.updateDocs(helper.collections.cacheInfo, filter, update);
    else
        throw new Error('invalid input for updateCacheInfo');
};

exports.getOneCacheInfoFieldsBy = getOneCacheInfoFieldsBy;
exports.updateCacheInfo = updateCacheInfo;
