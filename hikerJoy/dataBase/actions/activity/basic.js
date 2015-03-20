
var Q = require('q');
var hikerJoy = require('hikerJoy');
var helper = require('dataBase_helper');

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getOneActBy = function (filter) {
    return helper.getOneDoc(helper.collections.acts, filter);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneActFieldsBy = function (filter, fields) {
    return helper.getOneDocFields(helper.collections.acts, filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneActiveActFieldsBy = function (filter, fields) {
    filter = filter ? filter : {};
    filter['statusId'] = { '$in': hikerJoy.constants.activeActStatus };
    return getOneActFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getOneUnremovedActFieldsBy = function (filter, fields) {
    filter = filter ? filter : {};
    filter['statusId'] = { '$ne': hikerJoy.constants.activityStatus.removed };
    return getOneActFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
var getActsBy = function (filter) {
    return helper.getDocs(helper.collections.acts, filter);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getActsFieldsBy = function (filter, fields) {
    return helper.getDocsFields(helper.collections.acts, filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getActiveActsFieldsBy = function (filter, fields) {
    filter = filter ? filter : {};
    filter['statusId'] = { '$in': hikerJoy.constants.activeActStatus };
    return getActsFieldsBy(filter, fields);
};

//filter must be { 'key1': 'value1', 'key2': 'value2' }
//fields must be { 'key1': 1or0, 'key2': 1or0 }
var getUnremovedActsFieldsBy = function (filter, fields) {
    filter = filter ? filter : {};
    filter['statusId'] = { '$ne': hikerJoy.constants.activityStatus.removed };
    return getActsFieldsBy(filter, fields);
};

var countActsBy = function (filter) {
    return helper.countDocs(helper.collections.acts, filter);
};

var insertOneAct = function (act) {
    if (act && !Array.isArray(act)) {
        delete act._id;
        return helper.insertOneDoc(helper.collections.acts, act);
    }
    else
        throw new Error('invalid input for insertOneAct');
};

//currently this function can only update one activity, the one first match
var updateActs = function (filter, update) {
    if(filter && update)
        return helper.updateDocs(helper.collections.acts, filter, update);
    else
        throw new Error('invalid input for updateActs');
};

//ATTENTION! only used by God role !
var removeActs = function (filter) {
    if(filter)
        return helper.removeDocs(helper.collections.acts, filter);
    else
        throw new Error('invalid input for removeActs');
};

exports.getOneActBy = getOneActBy;
exports.getOneActFieldsBy = getOneActFieldsBy;
exports.getOneActiveActFieldsBy = getOneActiveActFieldsBy;
exports.getOneUnremovedActFieldsBy = getOneUnremovedActFieldsBy;
exports.getActsBy = getActsBy;
exports.getActsFieldsBy = getActsFieldsBy;
exports.getActiveActsFieldsBy = getActiveActsFieldsBy;
exports.getUnremovedActsFieldsBy = getUnremovedActsFieldsBy;
exports.countActsBy = countActsBy;
exports.insertOneAct = insertOneAct;
exports.updateActs = updateActs;
exports.removeActs = removeActs;
