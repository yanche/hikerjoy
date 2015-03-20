
var Q = require('q');
var helper = require('dataBase_helper');
var hikerJoy = require('hikerJoy');

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneForumPostFieldsBy = function (filter, fields) {
    return helper.getOneDocFields(helper.collections.forumPost, filter, fields);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getOneActiveForumPostFieldsBy = function (filter, fields) {
    if (filter['$query'])
        filter['$query'].statusId = hikerJoy.constants.forumPostStatus.active;
    else
        filter.statusId = hikerJoy.constants.forumPostStatus.active;
    return getOneForumPostFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getForumPostsFieldsBy = function (filter, fields, skip, take) {
    return helper.getDocsFieldsInPage(helper.collections.forumPost, filter, fields, skip, take);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getActiveForumPostsFieldsBy = function (filter, fields, skip, take) {
    if (filter['$query'])
        filter['$query'].statusId = hikerJoy.constants.forumPostStatus.active;
    else
        filter.statusId = hikerJoy.constants.forumPostStatus.active;
    return getForumPostsFieldsBy(filter, fields, skip, take);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneForumPostPrmFieldsBy = function (filter, fields) {
    return helper.getOneDocFields(helper.collections.forumPostPrm, filter, fields);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getOneActiveForumPostPrmFieldsBy = function (filter, fields) {
    if (filter['$query'])
        filter['$query'].statusId = hikerJoy.constants.forumPostPrmStatus.active;
    else
        filter.statusId = hikerJoy.constants.forumPostPrmStatus.active;
    return getOneForumPostPrmFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getForumPostPrmsFieldsBy = function (filter, fields, skip, take) {
    return helper.getDocsFieldsInPage(helper.collections.forumPostPrm, filter, fields, skip, take);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getActiveForumPostPrmsFieldsBy = function (filter, fields, skip, take) {
    if (filter['$query'])
        filter['$query'].statusId = hikerJoy.constants.forumPostPrmStatus.active;
    else
        filter.statusId = hikerJoy.constants.forumPostPrmStatus.active;
    return getForumPostPrmsFieldsBy(filter, fields, skip, take);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneForumPostSecFieldsBy = function (filter, fields) {
    return helper.getOneDocFields(helper.collections.forumPostSec, filter, fields);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getOneActiveForumPostSecFieldsBy = function (filter, fields) {
    if (filter['$query'])
        filter['$query'].statusId = hikerJoy.constants.forumPostSecStatus.active;
    else
        filter.statusId = hikerJoy.constants.forumPostSecStatus.active;
    return getOneForumPostSecFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getForumPostSecsFieldsBy = function (filter, fields) {
    return helper.getDocsFields(helper.collections.forumPostSec, filter, fields);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getActiveForumPostSecsFieldsBy = function (filter, fields) {
    if (filter['$query'])
        filter['$query'].statusId = hikerJoy.constants.forumPostSecStatus.active;
    else
        filter.statusId = hikerJoy.constants.forumPostSecStatus.active;
    return getForumPostSecsFieldsBy(filter, fields);
};

var insertOneForumPostSec = function (sec) {
    if (sec && !Array.isArray(sec)) {
        delete sec._id;
        return helper.insertOneDoc(helper.collections.forumPostSec, sec);
    }
    else
        throw new Error('invalid input for insertOneForumPostSec');
};

var updateForumPostSecs = function (filter, update) {
    if (filter && update)
        return helper.updateDocs(helper.collections.forumPostSec, filter, update);
    else
        throw new Error('invalid input for updateForumPostSecs');
};

var insertOneForumPostPrm = function (prm) {
    if (prm && !Array.isArray(prm)) {
        delete prm._id;
        return helper.insertOneDoc(helper.collections.forumPostPrm, prm);
    }
    else
        throw new Error('invalid input for insertOneForumPostPrm');
};

var updateForumPostPrms = function (filter, update) {
    if (filter && update)
        return helper.updateDocs(helper.collections.forumPostPrm, filter, update);
    else
        throw new Error('invalid input for updateForumPostPrms');
};

var insertOneForumPost = function (post) {
    if (post && !Array.isArray(post)) {
        delete post._id;
        return helper.insertOneDoc(helper.collections.forumPost, post);
    }
    else
        throw new Error('invalid input for insertOneForumPost');
};

var updateForumPosts = function (filter, update) {
    if (filter && update)
        return helper.updateDocs(helper.collections.forumPost, filter, update);
    else
        throw new Error('invalid input for updateForumPosts');
};

var getActiveForumPostsCount = function (orgObjId, actObjId, label) {
    var filter = { 'statusId': hikerJoy.constants.forumPostStatus.active };
    if (orgObjId)
        filter.orgId = orgObjId;
    if (actObjId)
        filter.actId = actObjId;
    if (label)
        filter.label = label;
    return _countForumPost(filter);
};

var getForumPostsCount = function (orgObjId, actObjId, label) {
    var filter = { '_id': { '$exists': true } };
    if (orgObjId)
        filter.orgId = orgObjId;
    if (actObjId)
        filter.actId = actObjId;
    if (label)
        filter.label = label;
    return _countForumPost(filter);
};

var getActiveForumPostPrmsCount = function (postObjId) {
    return _countForumPostPrm({ 'statusId': hikerJoy.constants.forumPostPrmStatus.active, 'postId': postObjId });
};

var getForumPostPrmsCount = function (postObjId) {
    return _countForumPostPrm({ 'postId': postObjId });
};

var getActiveForumPostSecsCount = function (postPrmObjId) {
    return _countForumPostSec({ 'statusId': hikerJoy.constants.forumPostSecStatus.active, 'postPrmId': postPrmObjId });
};

var getForumPostSecsCount = function (postPrmObjId) {
    return _countForumPostSec({ 'postPrmId': postPrmObjId });
};

var _countForumPost = function (filter) {
    return helper.countDocs(helper.collections.forumPost, filter);
};

var _countForumPostPrm = function (filter) {
    return helper.countDocs(helper.collections.forumPostPrm, filter);
};

var _countForumPostSec = function (filter) {
    return helper.countDocs(helper.collections.forumPostSec, filter);
};


exports.getOneForumPostFieldsBy = getOneForumPostFieldsBy;
exports.getOneActiveForumPostFieldsBy = getOneActiveForumPostFieldsBy;
exports.getForumPostsFieldsBy = getForumPostsFieldsBy;
exports.getActiveForumPostsFieldsBy = getActiveForumPostsFieldsBy;

exports.getOneForumPostPrmFieldsBy = getOneForumPostPrmFieldsBy;
exports.getOneActiveForumPostPrmFieldsBy = getOneActiveForumPostPrmFieldsBy;
exports.getForumPostPrmsFieldsBy = getForumPostPrmsFieldsBy;
exports.getActiveForumPostPrmsFieldsBy = getActiveForumPostPrmsFieldsBy;

exports.getOneForumPostSecFieldsBy = getOneForumPostSecFieldsBy;
exports.getOneActiveForumPostSecFieldsBy = getOneActiveForumPostSecFieldsBy;
exports.getForumPostSecsFieldsBy = getForumPostSecsFieldsBy;
exports.getActiveForumPostSecsFieldsBy = getActiveForumPostSecsFieldsBy;

exports.insertOneForumPostSec = insertOneForumPostSec;
exports.updateForumPostSecs = updateForumPostSecs;
exports.insertOneForumPostPrm = insertOneForumPostPrm;
exports.updateForumPostPrms = updateForumPostPrms;
exports.insertOneForumPost = insertOneForumPost;
exports.updateForumPosts = updateForumPosts;

exports.getActiveForumPostsCount = getActiveForumPostsCount;
exports.getForumPostsCount = getForumPostsCount;
exports.getActiveForumPostPrmsCount = getActiveForumPostPrmsCount;
exports.getForumPostPrmsCount = getForumPostPrmsCount;
exports.getActiveForumPostSecsCount = getActiveForumPostSecsCount;
exports.getForumPostSecsCount = getForumPostSecsCount;
