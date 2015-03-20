
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var getRCObj = helper.getRCObj;
var attachToPack = helper.attachToPack;
var expectedError = helper.expectedError;
var dsHelper = require('dataServer_helper');
var objectId = require('mongodb').ObjectID;
var utility = require('utility');
var Q = require('q');

//input: {'orgAlias':, 'intro': [], 'shortIntro': }
//output: {'returnCode':, 'msg':, 'picUrls': [] }
var updateOrgIntro = function (pack) {
    var orgAlias = pack.req.body.orgAlias, intro = pack.req.body.intro, shortIntro = pack.req.body.shortIntro;
    if (!hikerJoy.validate.validateValuedString(orgAlias) || (typeof shortIntro) !== 'string')
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgIntro_rc.orgNotFound));
    if (!Array.isArray(intro))
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgIntro_rc.inputParaError));
    shortIntro = shortIntro.trim();
    var picUrls = null, defer = new Q.defer();
    authClient.authQuery.canUpdateOrgIntro({ 'org': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth) {
            var picUploadPromises = dsHelper.uploadImageForHtmlPost(intro) || [];
            return Q.all(picUploadPromises);
        }
        else
            throw expectedError(hikerJoy.constants.updateOrgIntro_rc.notAuth);
    })
    .then(function (_picUrls) {
        picUrls = _picUrls;
        return dataBase.updateActiveOrgs({ 'alias': orgAlias }, { '$set': { 'intro': intro, 'shortIntro': shortIntro } });
    })
    .then(function (ct) {
        if (ct) {
            var rt = getRCObj(hikerJoy.constants.updateOrgIntro_rc.success);
            rt.picUrls = picUrls;
            defer.resolve(attachToPack(pack, rt));
        }
        else
            throw expectedError(hikerJoy.constants.updateOrgIntro_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgIntro_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias': }
//output: {'intro':, 'shortIntro': }
var getOrgIntro = function (pack) {
    var emptyRet = { 'intro': [], 'shortIntro': '' };
    var orgAlias = pack.req.body.orgAlias;
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, emptyRet);

    //any one can access org intro
    var defer = new Q.defer();
    dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { 'intro': 1, 'shortIntro': 1 })
    .then(function (org) {
        if (org)
            defer.resolve(attachToPack(pack, { 'intro': org.intro || [], 'shortIntro': org.shortIntro || '' }));
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

exports.updateOrgIntro = updateOrgIntro;
exports.getOrgIntro = getOrgIntro;
