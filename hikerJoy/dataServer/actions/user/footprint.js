
var Q = require('q');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;
var dsHelper = require('dataServer_helper');
var objectId = require('mongodb').ObjectID;
var utility = require('utility');

//input: { 'orgAlias': if not give, then all orgs }
//output: { 'history': [], 'active': [] }
var getUserFootprint = function (pack) {
    var authInfo = pack.req.session.user, orgAlias = pack.req.body.orgAlias, emptyRet = {};
    if (!authInfo)
        return attachToPack(pack, emptyRet);
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        orgAlias = null;

    var defer = new Q.defer();
    var footprintPromise = orgAlias ? dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 })
    .then(function (org) {
        if (org)
            return dataBase.getUserOrgActFootprint(authInfo._id, org._id);
        else
            throw expectedError('org with alias: ' + orgAlias + ' not found in getUserFootprint.');
    }) : dataBase.getUserOrgActFootprint(authInfo._id, null);

    footprintPromise.then(function (footprint) { //format: { 'history': [], 'active': [] }
        if (footprint)
            defer.resolve(attachToPack(pack, footprint));
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    })
    return defer.promise;
};

//input: { 'userActId': }
//output: { 'returnCode':, 'msg': }
var userActQuit = function (pack) {
    var authInfo = pack.req.session.user, userActObjId = utility.tryConvert2ObjId(pack.req.body.userActId);
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.userActQuit_rc.userNotFound));
    if (!userActObjId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.userActQuit_rc.actNotFound));

    var defer = new Q.defer();
    var userObjId = authInfo._id;
    dataBase.getUserActsFieldsBy({ 'userId': userObjId, '_id': userActObjId }, { 'actId': 1, 'statusId': 1 })
    .then(function (userActs) {
        if (!hikerJoy.validate.validateNonEmptyArray(userActs))
            throw expectedError(hikerJoy.constants.userActQuit_rc.actNotFound);
        else if (userActs.length > 1) //should not happen
            throw expectedError(hikerJoy.constants.userActQuit_rc.unKnownError);
        else {
            var statusId = userActs[0].statusId;
            if (hikerJoy.constants.inactiveActMemberStatus.contains(statusId))
                throw expectedError(hikerJoy.constants.userActQuit_rc.memStatusNotAllowQuit);
            else
                return dataBase.getActsFieldsBy({ '_id': userActs[0].actId }, { 'statusId': 1 });
        }
    })
    .then(function (orgActs) {
        if (!Array.isArray(orgActs) || orgActs.length !== 1)
            throw expectedError(hikerJoy.constants.userActQuit_rc.unKnownError);
        else if (orgActs[0].statusId !== hikerJoy.constants.activityStatus.open)
            throw expectedError(hikerJoy.constants.userActQuit_rc.actStatusNotAllowQuit);
        else
            return dataBase.updateUserActs({ '_id': userActObjId }, { '$set': { 'statusId': hikerJoy.constants.actMemberStatus.quit } });
    })
    .then(function (ct) {
        if (ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.userActQuit_rc.success)));
        else
            throw expectedError(hikerJoy.constants.userActQuit_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.userActQuit_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: { 'userActId':, 'items': [] }
//output: { 'returnCode':, 'msg': }
var updateUserSignupSheet = function (pack) {
    var authInfo = pack.req.session.user, userActId = pack.req.body.userActId;
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateUserSignupSheet_rc.userNotFound));
    if (!userActId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateUserSignupSheet_rc.actNotFound));
    var items = pack.req.body.items;
    items = hikerJoy.validate.validateAndAdjustSignupSheet(items);
    if (!items)
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateUserSignupSheet_rc.inputParaError));

    var defer = new Q.defer(), userObjId = authInfo._id, userActObjId = new objectId(userActId), picUrls = null;
    dataBase.getUserActsFieldsBy({ 'userId': userObjId, '_id': userActObjId }, { 'actId': 1, 'statusId': 1 })
    .then(function (userActs) {
        if (!Array.isArray(userActs) || userActs.length == 0)
            throw expectedError(hikerJoy.constants.updateUserSignupSheet_rc.actNotFound);
        else if (userActs.length > 1) //should not happen
            throw expectedError(hikerJoy.constants.updateUserSignupSheet_rc.unKnownError);
        else {
            var statusId = userActs[0].statusId;
            if (hikerJoy.constants.inactiveActMemberStatus.contains(statusId))
                throw expectedError(hikerJoy.constants.updateUserSignupSheet_rc.memStatusNotAllowUpdate);
            else
                return dataBase.getActsFieldsBy({ '_id': userActs[0].actId }, { 'statusId': 1 });
        }
    })
    .then(function (orgActs) {
        if (!Array.isArray(orgActs) || orgActs.length !== 1)
            throw expectedError(hikerJoy.constants.updateUserSignupSheet_rc.unKnownError);
        else if (orgActs[0].statusId !== hikerJoy.constants.activityStatus.open)
            throw expectedError(hikerJoy.constants.updateUserSignupSheet_rc.actStatusNotAllowUpdate);
        else
            return dsHelper.uploadSheetImage(items);
    })
    .then(function (_picUrls) {
        picUrls = _picUrls;
        return dataBase.replaceUserActItems(userActObjId, items);
    })
    .then(function (ct) {
        if (ct) {
            var rc = getRCObj(hikerJoy.constants.updateUserSignupSheet_rc.success);
            rc.picUrls = picUrls;
            defer.resolve(attachToPack(pack, rc));
        }
        else
            throw expectedError(hikerJoy.constants.updateUserSignupSheet_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateUserSignupSheet_rc.unKnownError)));
        }
    });
    return defer.promise;
};

exports.getUserFootprint = getUserFootprint;
exports.userActQuit = userActQuit;
exports.updateUserSignupSheet = updateUserSignupSheet;
