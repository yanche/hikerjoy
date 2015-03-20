
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

//input: {'contextUpdatedOn': }
//output: {'contextUpdatedOn':, 'context': [ {'_id':, 'statusId':, 'alias':, 'fullName':, 'shortName':, 'bannerUrl':, 'logoUrl':, 'createdOn':} ] }
//public access
var getOrgContext = function (pack) {
    var defer = new Q.defer();
    var contextUpdatedOn = utility.tryConvert2Date(pack.req.body.contextUpdatedOn), contextLastUpdated = null;
    var userObjId = utility.tryConvert2ObjId(pack.req.session.user ? pack.req.session.user._id : false);
    var fields = { '_id': 1, 'statusId': 1, 'alias': 1, 'fullName': 1, 'shortName': 1, 'bannerUrl': 1, 'logoUrl': 1, 'createdOn': 1 };
    dataBase.getOneCacheInfoFieldsBy({'key': hikerJoy.config.cachedInfo.orgContextUpdatedOn}, {'value': 1})
    .then(function (lastUpdate) {
        if(lastUpdate && lastUpdate.value && contextUpdatedOn && utility.dateEquals(contextUpdatedOn, lastUpdate.value))
            throw expectedError({});
        else {
            contextLastUpdated = lastUpdate.value;
            return dataBase.getOrgsFieldsBy({}, fields)
        }
    })
    .then(function (orgs) {
        if ( !hikerJoy.validate.validateNonEmptyArray( orgs ) )
            orgs = [];
        defer.resolve( attachToPack( pack, { 'contextUpdatedOn': contextLastUpdated, 'context': orgs }) );
    })
    .fail(function (err) {
        if (!err.expected) {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, {}));
        }
        else
            defer.resolve(attachToPack(pack, err.hikerJoy_ret));
    });
    return defer.promise;
};

//input: {'orgAlias':, 'pic64':, 'type':}
//output: {'returnCode':, 'msg':, 'url':}
var uploadOrgPic = function (pack) {
    var orgAlias = pack.req.body.orgAlias, pic64 = pack.req.body.pic64, type = pack.req.body.type;
    if (!hikerJoy.validate.validateValuedString(orgAlias) || (type !== 'banner' && type !== 'logo') || !hikerJoy.validate.validatePicUrlInBase64(pic64))
        return attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgPic_rc.inputParaError));
    if (!pack.req.session.user)
        attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgPic_rc.notAuth))

    var defer = new Q.defer(), picUrl = null;
    authClient.authQuery.canUpdateOrgPic({ 'org': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth) {
            var uploadReq = utility.getImagePostFormat(pic64);
            return dsHelper.uploadRequest([uploadReq]); //upload one pic to file server
        }
        else
            throw expectedError(hikerJoy.constants.updateOrgPic_rc.notAuth);
    })
    .then(function (vals) {
        if (!vals || !Array.isArray(vals) || !vals[0])
            throw expectedError(hikerJoy.constants.updateOrgPic_rc.uploadImageFail);
        else {
            picUrl = vals[0];
            //save the url record to db.
            return type === 'banner' ? dataBase.updateOrgBannerUrl(orgAlias, picUrl) : dataBase.updateOrgLogoUrl(orgAlias, picUrl);
        }
    })
    .then(function (ct) {
        if (ct) {
            var ret = getRCObj(hikerJoy.constants.updateOrgPic_rc.success);
            ret.url = picUrl;
            defer.resolve(attachToPack(pack, ret));
            dsHelper.updateCacheInfo(hikerJoy.config.cachedInfo.orgContextUpdatedOn, new Date());
        }
        else
            throw expectedError(hikerJoy.constants.updateOrgPic_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.updateOrgPic_rc.unKnownError)));
        }
    });
    return defer.promise;
};

exports.getOrgContext = getOrgContext;
exports.uploadOrgPic = uploadOrgPic;
