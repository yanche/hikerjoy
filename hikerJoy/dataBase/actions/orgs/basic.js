
var Q = require('q');
var helper = require('dataBase_helper');
var hikerJoy = require('hikerJoy');

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getOneOrgBy = function (filter) {
    return helper.getOneDoc(helper.collections.orgs, filter);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneOrgFieldsBy = function (filter, fields) {
    return helper.getOneDocFields(helper.collections.orgs, filter, fields);
}

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getOneActiveOrgBy = function (filter) {
    filter.statusId = hikerJoy.constants.orgStatus.active;
    return getOneOrgBy(filter);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneActiveOrgFieldsBy = function (filter, fields) {
    filter.statusId = hikerJoy.constants.orgStatus.active;
    return getOneOrgFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getOrgsBy = function (filter) {
    return helper.getDocs(helper.collections.orgs, filter);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOrgsFieldsBy = function (filter, fields) {
    return helper.getDocsFields(helper.collections.orgs, filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getActiveOrgsBy = function (filter) {
    filter.statusId = hikerJoy.constants.orgStatus.active;
    return getOrgsBy(filter);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getActiveOrgsFieldsBy = function (filter, fields) {
    filter.statusId = hikerJoy.constants.orgStatus.active;
    return getOrgsFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var updateOrgs = function (filter, update) {
    if(filter && update)
        return helper.updateDocs(helper.collections.orgs, filter, update);
    else
        throw new Error('invalid input for updateOrgs');
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be update object
var updateActiveOrgs = function (filter, update) {
    filter.statusId = hikerJoy.constants.orgStatus.active;
    return updateOrgs(filter, update);
};

var insertOneOrg = function (org) {
    if(!org || Array.isArray(org))
        throw new Error('no input for insertOrg');
    delete org._id;
    return helper.insertOneDoc(helper.collections.orgs, org);
};

exports.getOneOrgBy = getOneOrgBy;
exports.getOneOrgFieldsBy = getOneOrgFieldsBy;
exports.getOneActiveOrgBy = getOneActiveOrgBy;
exports.getOneActiveOrgFieldsBy = getOneActiveOrgFieldsBy;
exports.getOrgsBy = getOrgsBy;
exports.getOrgsFieldsBy = getOrgsFieldsBy;
exports.getActiveOrgsBy = getActiveOrgsBy;
exports.getActiveOrgsFieldsBy = getActiveOrgsFieldsBy;
exports.updateOrgs = updateOrgs;
exports.updateActiveOrgs = updateActiveOrgs;
exports.insertOneOrg = insertOneOrg;
