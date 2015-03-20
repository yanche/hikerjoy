
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var getRCObj = helper.getRCObj;
var attachToPack = helper.attachToPack;
var expectedError = helper.expectedError;
var dsHelper = require('dataServer_helper');
var utility = require('utility');
var Q = require('q');
var objectId = require('mongodb').ObjectID;

//input: {'orgId': }
//output: {'returnCode':, 'msg': }
var reactivateOrg = function (pack) {
    var orgObjId = utility.tryConvert2ObjId(pack.req.body.orgId);
    if (!orgObjId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.reactivateOrg_rc.inputParaError));
    if (!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.reactivateOrg_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canReactivateOrg({ 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneOrgFieldsBy({ '_id': orgObjId }, { '_id': 1, 'statusId': 1 });
        else
            throw expectedError(hikerJoy.constants.reactivateOrg_rc.notAuth);
    })
    .then(function (org) {
        if (org) {
            if (org.statusId == hikerJoy.constants.orgStatus.active)
                throw expectedError(hikerJoy.constants.reactivateOrg_rc.active);
            else
                return dataBase.updateOrgs({ '_id': orgObjId }, { '$set': { 'statusId': hikerJoy.constants.orgStatus.active } });
        }
        else
            throw expectedError(hikerJoy.constants.reactivateOrg_rc.orgNotFound);
    })
    .then(function (ct) {
        if (ct) {
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.reactivateOrg_rc.success)));
            dsHelper.updateCacheInfo(hikerJoy.config.cachedInfo.orgContextUpdatedOn, new Date());
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.reactivateOrg_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.reactivateOrg_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgId': }
//output: {'returnCode':, 'msg': }
var disactivateOrg = function (pack) {
    var orgObjId = utility.tryConvert2ObjId(pack.req.body.orgId);
    if (!orgObjId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.disactivateOrg_rc.inputParaError));
    if (!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.disactivateOrg_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canDisactivateOrg({ 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneOrgFieldsBy({ '_id': orgObjId }, { '_id': 1, 'statusId': 1 });
        else
            throw expectedError(hikerJoy.constants.disactivateOrg_rc.notAuth);
    })
    .then(function (org) {
        if (org) {
            if (org.statusId == hikerJoy.constants.orgStatus.inactive)
                throw expectedError(hikerJoy.constants.disactivateOrg_rc.inactive);
            else
                return dataBase.updateOrgs({ '_id': orgObjId }, { '$set': { 'statusId': hikerJoy.constants.orgStatus.inactive } });
        }
        else
            throw expectedError(hikerJoy.constants.disactivateOrg_rc.orgNotFound);
    })
    .then(function (ct) {
        if (ct) {
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateOrg_rc.success)));
            dsHelper.updateCacheInfo(hikerJoy.config.cachedInfo.orgContextUpdatedOn, new Date());
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateOrg_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.disactivateOrg_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias': }
//output: {'available': true or false}
var orgAliasAvailable = function (pack) {
    var defaultRet = { 'available': false }, orgAlias = pack.req.body.orgAlias;
    if (!pack.req.session.user || !hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, defaultRet);

    orgAlias = orgAlias.trim().toLowerCase();
    var defer = new Q.defer();
    authClient.authQuery.canGetOrgAliasAvailability({ 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 });
        else
            throw expectedError('not authorized to orgAliasAvailable');
    })
    .then(function (org) {
        if (org)
            defer.resolve(attachToPack(pack, defaultRet));
        else
            defer.resolve(attachToPack(pack, { 'available': true }));
    })
    .fail(function (err) {
        if (!err.expected)  console.log(err.stack);
        defer.resolve(attachToPack(pack, defaultRet));
    });
    return defer.promise;
};

//input: {'orgId':, 'alias':, 'shortName':, 'fullName': }
//output: {'returnCode':, 'msg': }
var updateOrgBasicInfo = function (pack) {
    var body = pack.req.body;
    var orgObjId = utility.tryConvert2ObjId(body.orgId), alias = body.alias, short = body.shortName, full = body.fullName;
    if (!orgObjId || !hikerJoy.validate.validateValuedString(alias) || !hikerJoy.validate.validateValuedString(short) || !hikerJoy.validate.validateValuedString(full))
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgBasicInfo_rc.inputParaError));
    if (!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgBasicInfo_rc.notAuth));

    alias = alias.trim().toLowerCase();
    short = short.trim();
    full = full.trim();
    var defer = new Q.defer();
    authClient.authQuery.canUpdateOrgBasicInfo({ 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneOrgFieldsBy({ '_id': orgObjId }, { '_id': 1 });
        else
            throw expectedError(hikerJoy.constants.updateOrgBasicInfo_rc.notAuth);
    })
    .then(function (org) {
        if (org)
            return dataBase.getOneOrgFieldsBy({ '_id': { '$ne': orgObjId }, 'alias': alias }, { '_id': 1 });
        else
            throw expectedError(hikerJoy.constants.updateOrgBasicInfo_rc.orgNotFound);
    })
    .then(function (org) {
        if (org)
            throw expectedError(hikerJoy.constants.updateOrgBasicInfo_rc.aliasDup);
        else
            return dataBase.updateOrgs({ '_id': orgObjId }, { '$set': { 'alias': alias, 'shortName': short, 'fullName': full } });
    })
    .then(function (ct) {
        if (ct) {
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgBasicInfo_rc.success)));
            dsHelper.updateCacheInfo(hikerJoy.config.cachedInfo.orgContextUpdatedOn, new Date());
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgBasicInfo_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgBasicInfo_rc.unKnownError)));
        }
    })
    return defer.promise;
};

//input: {'alias':, 'shortName':, 'fullName': }
//output: {'returnCode':, 'msg':, 'orgId': }
var createNewOrg = function (pack) {
    var body = pack.req.body;
    var alias = body.alias, short = body.shortName, full = body.fullName;
    if (!hikerJoy.validate.validateValuedString(alias) || !hikerJoy.validate.validateValuedString(short) || !hikerJoy.validate.validateValuedString(full))
        return attachToPack(pack, getRCObj(hikerJoy.constants.createNewOrg_rc.inputParaError));
    if (!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.createNewOrg_rc.notAuth));

    alias = alias.trim().toLowerCase();
    short = short.trim();
    full = full.trim();
    var defer = new Q.defer();
    authClient.authQuery.canCreateNewOrg({ 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneOrgFieldsBy({ 'alias': alias }, { '_id': 1 });
        else
            throw expectedError(hikerJoy.constants.createNewOrg_rc.notAuth);
    })
    .then(function (org) {
        if (org)
            throw expectedError(hikerJoy.constants.createNewOrg_rc.aliasDup);
        else {
            var newOrg = hikerJoy.org.createPlainOrg(alias, short, full);
            newOrg.templates = [ {'name': '户外线路', 'items': [{'label': '装备', 'type': 'multi-select', 'children': ['帐篷', '睡袋', '头灯', '防潮垫', '背包']}, {'label': '学校', 'type': 'text'}, {'label': '年级', 'type': 'text'}]} ];
            return dataBase.insertOneOrg(newOrg);
        }
    })
    .then(function (org) {
        if (org) {
            var ret = getRCObj(hikerJoy.constants.createNewOrg_rc.success);
            ret.orgId = org._id;
            defer.resolve(attachToPack(pack, ret));
            dsHelper.updateCacheInfo(hikerJoy.config.cachedInfo.orgContextUpdatedOn, new Date());
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.createNewOrg_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.createNewOrg_rc.unKnownError)));
        }
    })
    return defer.promise;
};

exports.reactivateOrg = reactivateOrg;
exports.disactivateOrg = disactivateOrg;
exports.orgAliasAvailable = orgAliasAvailable;
exports.updateOrgBasicInfo = updateOrgBasicInfo;
exports.createNewOrg = createNewOrg;
