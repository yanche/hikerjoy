
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

//input: {'orgAlias': }
//output: {'weixinId': }
var getOrgWeixinId = function (pack) {
    var orgAlias = pack.req.body.orgAlias, emptyRet = { 'weixinId': '' };
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer();
    authClient.authQuery.canGetOrgWeixinId({ 'sid': pack.req.session.sessionId, 'orgAlias': orgAlias })
    .then(function (authRet) {
        if (authRet && authRet.auth)
            return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { 'weixinId': 1 });
        else
            throw expectedError('not authorize to getOrgWeixinId');
    })
    .then(function (org) {
        if (org)
            defer.resolve(attachToPack(pack, { 'weixinId': org.weixinId || '' }));
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'orgAlias':, 'weixinId': }
//output: {'returnCode':, 'msg': }
var submitOrgWeixinId = function (pack) {
    var orgAlias = pack.req.body.orgAlias, weixinId = pack.req.body.weixinId;
    if (!hikerJoy.validate.validateValuedString(orgAlias) || (typeof weixinId) !== 'string')
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinId_rc.inputParaError));
    weixinId = weixinId.trim();
    var defer = new Q.defer();
    authClient.authQuery.canSubmitOrgWeixinId({ 'sid': pack.req.session.sessionId, 'orgAlias': orgAlias })
    .then(function (authRet) {
        if (authRet && authRet.auth)
            return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1, 'weixinId': 1 });
        else
            throw expectedError(hikerJoy.constants.submitOrgWeixinId_rc.notAuth);
    })
    .then(function (org) {
        if (org) {
            if (org.weixinId == weixinId)
                throw expectedError(hikerJoy.constants.submitOrgWeixinId_rc.noChange);
            else
                return dataBase.updateOrgs({ '_id': org._id }, { '$set': { 'weixinId': weixinId } });
        }
        else
            throw expectedError(hikerJoy.constants.submitOrgWeixinId_rc.orgNotFound);
    })
    .then(function (ct) {
        if (ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinId_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinId_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinId_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias': }
//output: {'default':, 'welcome':, 'auto': }
var getOrgWeixinReplies = function (pack) {
    var orgAlias = pack.req.body.orgAlias, emptyRet = {};
    if (!hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer()
    authClient.authQuery.canGetOrgWeixinReplies({ 'sid': pack.req.session.sessionId, 'orgAlias': orgAlias })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOrgWeixinReplies(orgAlias);
        else
            throw expectedError('not authorized to getOrgWeixin for org: ' + orgAlias);
    })
    .then(function (weixin) {
        defer.resolve(attachToPack(pack, weixin));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'orgAlias':, 'replyId': id or 'default', 'weixin': }
//output: {'returnCode':, 'msg':, 'replyId':, 'picUrls': [] }
//update or insert
var submitOrgWeixinReply = function (pack) {
    if (!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinReply_rc.notAuth));
    var orgAlias = pack.req.body.orgAlias, replyId = pack.req.body.replyId, weixinBody = hikerJoy.validate.validateAndAdjustWeixinBody(pack.req.body.weixin, replyId === 'default' || replyId === 'welcome');
    if (!hikerJoy.validate.validateValuedString(orgAlias) || !weixinBody)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinReply_rc.inputParaError));

    var orgObjId = null, defer = new Q.defer(), replyObjId = utility.tryConvert2ObjId(replyId), picUrls = null;
    authClient.authQuery.canSubmitOrgWeixinReply({ 'sid': pack.req.session.sessionId, 'orgAlias': orgAlias })
    .then(function (ret) { //find org
        if (ret && ret.auth)
            return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 });
        else
            throw expectedError(hikerJoy.constants.submitOrgWeixinReply_rc.notAuth);
    })
    .then(function (org) { //upload image
        if (org) {
            orgObjId = org._id;
            if (weixinBody.type === 'news') { //news or text
                var picData = [];
                weixinBody.news.forEach(function (v) {
                    if (hikerJoy.validate.validatePicUrlInBase64(v.picUrl))
                        picData.push(utility.getImagePostFormat(v.picUrl));
                });
                if (picData.length > 0) {
                    var deferPic = new Q.defer();
                    dsHelper.uploadRequest(picData)
                    .then(function (url) {
                        if (Array.isArray(url) && url.length === picData.length) {
                            var i = 0;
                            weixinBody.news.forEach(function (v) {
                                if (hikerJoy.validate.validatePicUrlInBase64(v.picUrl))
                                    v.picUrl = url[i++];
                            });
                            deferPic.resolve(url);
                        }
                        else
                            deferPic.reject(expectedError(hikerJoy.constants.submitOrgWeixinReply_rc.imageUploadFail));
                    })
                    .fail(function (err) {
                        if(!err.expected) console.log(err.stack);
                        deferPic.reject(expectedError(hikerJoy.constants.submitOrgWeixinReply_rc.imageUploadFail));
                    });
                    return deferPic.promise;
                }
            }
        }
        else
            throw expectedError(hikerJoy.constants.submitOrgWeixinReply_rc.orgNotFound);
    })
    .then(function (_picUrls) {
        picUrls = _picUrls;
        if (replyId === 'default')
            return dataBase.updateOrgs({ '_id': orgObjId }, { '$set': { 'weixinDefault': weixinBody } });
        else if (replyId === 'welcome')
            return dataBase.updateOrgs({ '_id': orgObjId }, { '$set': { 'weixinWelcome': weixinBody } });
        else if (!replyObjId) {
            weixinBody.orgId = orgObjId;
            weixinBody.createdOn = new Date();
            weixinBody.statusId = hikerJoy.constants.weixinReplyStatus.active;
            return dataBase.insertOneWeixinReply(weixinBody);
        }
        else {
            return dataBase.updateWeixin(
                { '_id': replyObjId, 'orgId': orgObjId, 'statusId': hikerJoy.constants.weixinReplyStatus.active },
                { '$set': { 'keywords': weixinBody.keywords, 'type': weixinBody.type, 'content': weixinBody.content, 'news': weixinBody.news } }
            );
        }
    })
    .then(function (ret) {
        if (ret) { //updated count or inserted obj
            var result = getRCObj(hikerJoy.constants.submitOrgWeixinReply_rc.success);
            if (replyId !== 'default' && replyId !== 'welcome' && !replyObjId)
                result.replyId = ret._id; //inserted _id
            else
                result.replyId = replyId; //update id or default
            result.picUrls = picUrls;
            defer.resolve(attachToPack(pack, result));
        }
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinReply_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinReply_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias':, 'replyId': id }
//output: {'returnCode':, 'msg': }
var archiveOrgWeixinReply = function (pack) {
    var orgAlias = pack.req.body.orgAlias, replyObjId = utility.tryConvert2ObjId(pack.req.body.replyId);
    if (!hikerJoy.validate.validateValuedString(orgAlias) || !replyObjId)
        return attachToPack(pack, getRCObj(hikerJoy.constants.archiveOrgWeixin_rc.inputParaError));
    if (!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.archiveOrgWeixin_rc.notAuth));

    var defer = new Q.defer();
    authClient.authQuery.canArchiveOrgWeixinReply({ 'sid': pack.req.session.sessionId, 'orgAlias': orgAlias })
    .then(function (ret) {
        if (ret && ret.auth)
            return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 });
        else
            throw expectedError(hikerJoy.constants.archiveOrgWeixin_rc.notAuth);
    })
    .then(function (org) {
        if (org)
            return dataBase.updateWeixin({ 'orgId': org._id, '_id': replyObjId, 'statusId': hikerJoy.constants.weixinReplyStatus.active }, { '$set': { 'statusId': hikerJoy.constants.weixinReplyStatus.inactive } });
        else
            throw expectedError(hikerJoy.constants.archiveOrgWeixin_rc.orgNotFound);
    })
    .then(function (ct) {
        if (ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.archiveOrgWeixin_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.archiveOrgWeixin_rc.weixinNotFound)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.archiveOrgWeixin_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'org': }
//output: {'fullName':, 'logoUrl':, 'shortIntro': }
var getOrgWeixinShareInfo = function (pack) {
    var orgAlias = pack.req.body.org, emptyRet = {};
    if ((typeof orgAlias) !== 'string' || orgAlias.length === 0)
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer();
    dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { 'fullName': 1, 'logoUrl': 1, 'shortIntro': 1 })
    .then(function (org) {
        if (org)
            defer.resolve(attachToPack(pack, org));
        else
            throw expectedError('org not found with alias: ' + orgAlias);
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'orgAlias': }
//output: {'activities':, 'intro':, }
var getOrgWeixinKeywords = function (pack) {
    var orgAlias = pack.req.body.orgAlias, emptyRet = {};
    if(!pack.req.session.user || !hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, emptyRet);
    var defer = new Q.defer();
    authClient.authQuery.canGetOrgWeixinKeywords({'orgAlias': orgAlias, 'sid': pack.req.session.sessionId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneActiveOrgFieldsBy({'alias': orgAlias}, {'weixinKeywords': 1});
        else
            throw expectedError('not authorized to getOrgWeixinKeywords');
    })
    .then(function (org) {
        if(org)
            defer.resolve(attachToPack(pack, org.weixinKeywords || {}));
        else
            throw expectedError('org not found by alias in getOrgWeixinKeywords: ' + orgAlias);
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//input: {'orgAlias':, 'key':, 'value': }
//output: {'returnCode':, 'msg': }
var submitOrgWeixinKeyword = function (pack) {
    var orgAlias = pack.req.body.orgAlias, key = pack.req.body.key, value = pack.req.body.value;
    if(!hikerJoy.validate.validateValuedString(orgAlias) || !hikerJoy.validate.validateValuedString(key) || (typeof value) !== 'string')
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinKeyword_rc.inputParaError));
    key = key.trim(); value = value.trim();
    if(!hikerJoy.config.orgWeixinKeywords.contains(key))
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinKeyword_rc.invalidKeyword));
    if(!pack.req.session.user)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinKeyword_rc.notAuth));
    var defer = new Q.defer();
    authClient.authQuery.canSubmitOrgWeixinKeywords({'orgAlias': orgAlias, 'sid': pack.req.session.sessionId})
    .then(function (authRet) {
        if(authRet && authRet.auth)
            return dataBase.getOneActiveOrgFieldsBy({'alias': orgAlias}, {'_id': 1, 'weixinKeywords': 1});
        else
            throw expectedError(hikerJoy.constants.submitOrgWeixinKeyword_rc.notAuth);
    })
    .then(function (org) {
        if(org) {
            var keywords = org.weixinKeywords || {}, dup = false, nochange = false;
            hikerJoy.config.orgWeixinKeywords.forEach(function (v) {
                if(!nochange && v === key)
                    if(keywords[v] === value) nochange = true;
                else if(!dup)
                    if(keywords[v] === value) dup = true;
            });
            if(dup)
                throw expectedError(hikerJoy.constants.submitOrgWeixinKeyword_rc.duplicate);
            if(nochange)
                throw expectedError(hikerJoy.constants.submitOrgWeixinKeyword_rc.noChange);
            keywords[key] = value;
            return dataBase.updateOrgs({'_id': org._id}, {'$set': {'weixinKeywords': keywords}});
        }
        else
            throw expectedError(hikerJoy.constants.submitOrgWeixinKeyword_rc.orgNotFound);
    })
    .then(function (ct) {
        if(ct)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinKeyword_rc.success)));
        else
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinKeyword_rc.unKnownError)));
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgWeixinKeyword_rc.unKnownError)));
        }
    });
    return defer.promise;
};

exports.getOrgWeixinId = getOrgWeixinId;
exports.submitOrgWeixinId = submitOrgWeixinId;
exports.getOrgWeixinReplies = getOrgWeixinReplies;
exports.submitOrgWeixinReply = submitOrgWeixinReply;
exports.archiveOrgWeixinReply = archiveOrgWeixinReply;
exports.getOrgWeixinShareInfo = getOrgWeixinShareInfo;
exports.getOrgWeixinKeywords = getOrgWeixinKeywords;
exports.submitOrgWeixinKeyword = submitOrgWeixinKeyword;
