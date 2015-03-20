
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var getRCObj = helper.getRCObj;
var attachToPack = helper.attachToPack;
var expectedError = helper.expectedError;
var utility = require('utility');
var Q = require('q');

//input: {'orgAlias':}
//output: [ {'name':, 'items':[{'label':,'type':,'children':}]} ]
var getOrgActTemplates = function (pack) {
    var orgAlias = pack.req.body.orgAlias, emptyRet = [];
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer();
    authClient.authQuery.canGetOrgActTemplates({ 'orgAlias': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { 'templates': 1 });
        else
            throw expectedError('not authorized to get org templates');
    })
    .then(function (org) {
        if (org && hikerJoy.validate.validateNonEmptyArray(org.templates))
            defer.resolve(attachToPack(pack, org.templates));
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'orgAlias':, 'template': {'name':, 'items':[{'label':,'type':,'children':}]} }
//output: {'returnCode':, 'msg':}
var upsertOrgSignupSheetTemplate = function (pack) {
    var orgAlias = pack.req.body.orgAlias, template = pack.req.body.template;
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, getRCObj(hikerJoy.constants.upsertOrgSignupSheetTemplate_rc.inputParaError));

    var defer = new Q.defer();
    authClient.authQuery.canUpsertOrgSignupSheetTemplate({ 'orgAlias': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth) {
            var adjTemplate = hikerJoy.validate.validateAndAdjustSignupSheetTemplate(template);
            if (!adjTemplate) //if failed in validation
                throw expectedError(hikerJoy.constants.upsertOrgSignupSheetTemplate_rc.inputParaInvalid);
            else
                return dataBase.upsertOrgSignupSheetTemplate(orgAlias, adjTemplate);
        }
        else
            throw expectedError(hikerJoy.constants.upsertOrgSignupSheetTemplate_rc.notAuth);
    })
    .then(function (ct) {
        if (ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.upsertOrgSignupSheetTemplate_rc.success)));
        else
            throw expectedError(hikerJoy.constants.upsertOrgSignupSheetTemplate_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.upsertOrgSignupSheetTemplate_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias':, 'oldName':, 'newName': }
//output: {'returnCode':, 'msg':}
var renameOrgSignupSheetTemplate = function (pack) {
    var orgAlias = pack.req.body.orgAlias, oldName = pack.req.body.oldName, newName = pack.req.body.newName;
    if (!hikerJoy.validate.validateValuedString(orgAlias) || !hikerJoy.validate.validateValuedString(newName) || (typeof oldName) !== 'string')
        return attachToPack(pack, getRCObj(hikerJoy.constants.renameOrgSignupSheetTemplate_rc.inputParaError));

    newName = newName.trim();
    oldName = oldName.trim();
    if (newName == oldName)
        return attachToPack(pack, getRCObj(hikerJoy.constants.renameOrgSignupSheetTemplate_rc.nameNoChange));

    var defer = new Q.defer();
    authClient.authQuery.canRenameOrgSignupSheetTemplate({ 'orgAlias': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { 'templates': 1 });
        else
            throw expectedError(hikerJoy.constants.renameOrgSignupSheetTemplate_rc.notAuth);
    })
    .then(function (org) {
        if (org && hikerJoy.validate.validateNonEmptyArray(org.templates)) {
            var tempNames = org.templates.map(function (v, k) {
                return v.name;
            });
            if (tempNames.contains(newName))
                throw expectedError(hikerJoy.constants.renameOrgSignupSheetTemplate_rc.duplicateName);
            if (!tempNames.contains(oldName))
                throw expectedError(hikerJoy.constants.renameOrgSignupSheetTemplate_rc.templateNotFound);
            return dataBase.updateActiveOrgs({ 'alias': orgAlias, 'templates.name': oldName }, { '$set': { 'templates.$.name': newName } });
        }
        else
            throw expectedError(hikerJoy.constants.renameOrgSignupSheetTemplate_rc.templateNotFound);
    })
    .then(function (ct) {
        if (ct) {
            var ret = getRCObj(hikerJoy.constants.renameOrgSignupSheetTemplate_rc.success);
            ret.newName = newName;
            defer.resolve(attachToPack(pack, ret));
        }
        else
            throw expectedError(hikerJoy.constants.renameOrgSignupSheetTemplate_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.renameOrgSignupSheetTemplate_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias':, 'name': }
//output: {'returnCode':, 'msg':}
var deleteOrgSignupSheetTemplate = function (pack) {
    var orgAlias = pack.req.body.orgAlias, name = pack.req.body.name;
    if (!hikerJoy.validate.validateValuedString(orgAlias) || (typeof name) !== 'string')
        return attachToPack(pack, getRCObj(hikerJoy.constants.deleteOrgSignupSheetTemplate_rc.inputParaError));

    var defer = new Q.defer();
    authClient.authQuery.canDeleteOrgSignupSheetTemplate({ 'orgAlias': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.updateActiveOrgs({ 'alias': orgAlias }, { '$pull': { 'templates': { 'name': name } } });
        else
            throw expectedError(hikerJoy.constants.deleteOrgSignupSheetTemplate_rc.notAuth);
    })
    .then(function (ct) {
        if (ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.deleteOrgSignupSheetTemplate_rc.success)));
        else
            throw expectedError(hikerJoy.constants.deleteOrgSignupSheetTemplate_rc.templateNotFound);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.deleteOrgSignupSheetTemplate_rc.unKnownError)));
        }
    });
    return defer.promise;
};

exports.getOrgActTemplates = getOrgActTemplates;
exports.upsertOrgSignupSheetTemplate = upsertOrgSignupSheetTemplate;
exports.renameOrgSignupSheetTemplate = renameOrgSignupSheetTemplate;
exports.deleteOrgSignupSheetTemplate = deleteOrgSignupSheetTemplate;
