
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
var log = require('hikerJoy_logClient');

//input: {'orgAlias':, 'actId': }
var setOrgActArchived = function (pack) {
    var inputLog = { 'body': pack.req.body, 'authInfo': pack.req.session.user };
    var authInfo = pack.req.session.user;
    if (!authInfo) {
        log.logWarning('dataServer-setOrgActArchived got request but no user login.', inputLog, null, '534E6EFE-DC84-46BD-9877-B5B76E3435D4');
        return attachToPack(pack, getRCObj(hikerJoy.constants.setOrgActArchived_rc.notAuth));
    }
    var orgAlias = pack.req.body.orgAlias, actId = pack.req.body.actId;
    var actObjId = utility.tryConvert2ObjId(actId);
    if (!actObjId || !hikerJoy.validate.validateValuedString(orgAlias)) {
        log.logWarning('dataServer-setOrgActArchived got request but input is invalid', inputLog, null, '39876B7A-32C5-462F-A111-62CD6B24CC3E');
        return attachToPack(pack, getRCObj(hikerJoy.constants.setOrgActArchived_rc.inputParaError));
    }

    var defer = new Q.defer();
    authClient.authQuery.canSetOrgActivityArchived({ 'org': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth === true) {
            return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 })
        }
        else {
            log.logWarning('dataServer-setOrgActArchived: user not authorized', inputLog, null, '3088B09F-86C1-4522-B9C2-494566CB16AB');
            throw expectedError(hikerJoy.constants.setOrgActArchived_rc.notAuth);
        }
    })
    .then(function (org) {
        if (org) {
            return dataBase.getOneActFieldsBy({ 'orgId': org._id, '_id': actObjId, 'statusId': { '$ne': hikerJoy.constants.activityStatus.removed } }, { '_id': 1, 'statusId': 1 });
        }
        else { //should not happen
            log.logWarning('dataServer-setOrgActArchived: authorized but org not found', inputLog, null, 'C9F5D2A2-1612-4D24-8B16-06C554DD8A6E');
            throw expectedError(hikerJoy.constants.setOrgActArchived_rc.notAuth);
        }
    })
    .then(function (act) {
        if (act) {
            if (act.statusId === hikerJoy.constants.activityStatus.archived) {
                log.logWarning('dataServer-setOrgActArchived: org found but activity is already archived', inputLog, null, '96B75DF0-52B6-4AEA-B39E-E67194B46A6B');
                throw expectedError(hikerJoy.constants.setOrgActArchived_rc.archived);
            }
            else
                return dataBase.updateActs({ '_id': act._id }, { '$set': { 'statusId': hikerJoy.constants.activityStatus.archived } });
        }
        else {
            log.logWarning('dataServer-setOrgActArchived: activity not found', inputLog, null, '31099948-D11A-4177-8029-963AEC34F4A5');
            throw expectedError(hikerJoy.constants.setOrgActArchived_rc.actNotFound);
        }
    })
    .then(function (rc) {
        if (rc === 1) { //one updated
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setOrgActArchived_rc.success)));
        }
        else { //should not happen
            log.logError('dataServer-setOrgActArchived: action executed result count is not expected: ' + rc, inputLog, null, '0CDA80F7-C4FA-4ED1-A591-14E5C618FAAA');
            throw expectedError(hikerJoy.constants.setOrgActArchived_rc.unKnownError);
        }
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            log.logError('dataServer-setOrgActArchived: got unexpected error', inputLog, err, '3408828E-0F72-477C-ADE5-64BDA1E560BE');
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setOrgActArchived_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias':, 'actId': }
var setOrgActRemoved = function (pack) {
    var authInfo = pack.req.session.user;
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.setOrgActRemoved_rc.notAuth));

    var orgAlias = pack.req.body.orgAlias, actId = pack.req.body.actId;
    var actObjId = utility.tryConvert2ObjId(actId);
    if (!actObjId || !hikerJoy.validate.validateValuedString(orgAlias))
        return attachToPack(pack, getRCObj(hikerJoy.constants.setOrgActRemoved_rc.inputParaError));

    var defer = new Q.defer();
    authClient.authQuery.canSetOrgActivityRemoved({ 'org': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth === true)
            return dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 });
        else
            throw expectedError(hikerJoy.constants.setOrgActRemoved_rc.notAuth);
    })
    .then(function (org) {
        if (org)
            return dataBase.getOneActFieldsBy({ 'orgId': org._id, '_id': actObjId, 'statusId': { '$ne': hikerJoy.constants.activityStatus.removed } }, { '_id': 1, 'statusId': 1 });
        else
            throw expectedError(hikerJoy.constants.setOrgActRemoved_rc.notAuth);
    })
    .then(function (act) {
        if (act)
            return dataBase.updateActs({ '_id': act._id }, { '$set': { 'statusId': hikerJoy.constants.activityStatus.removed } });
        else
            throw expectedError(hikerJoy.constants.setOrgActRemoved_rc.actNotFound);
    })
    .then(function (rc) {
        if (rc === 1)
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setOrgActRemoved_rc.success)));
        else
            throw expectedError(hikerJoy.constants.setOrgActRemoved_rc.unKnownError);
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.setOrgActRemoved_rc.unKnownError)));
        }
    });
    return defer.promise;
};

//input: {'orgAlias':, 'act': {'_id':, 'orgId':, 'statusId':, 'name':, 'startsOn':, 'endsOn':, 'organizer':[ id of user ], 'intro':, 'createdOn':, 'picUrl':, 'sheet':, 'recruitment':, 'tags': }}
//output: {'returnCode':, 'msg':, 'picUrl':, 'recruitmentPicUrls': [], 'recruitmentUpdatedOn':, '_id':, 'orgId': }
var submitOrgActivity = function (pack) {
    var authInfo = pack.req.session.user, orgAlias = pack.req.body.orgAlias, act = pack.req.body.act;
    var orgObjId = utility.tryConvert2ObjId(act.orgId), actObjId = utility.tryConvert2ObjId(act._id);
    if (!authInfo)
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgActivity_rc.notAuth));
    if (!hikerJoy.validate.validateValuedString(orgAlias) || (act.orgId && !orgObjId) || (act._id && !actObjId))
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgActivity_rc.inputParaError));
    var adjAct = hikerJoy.validate.validateAndAdjustSubmitAct(act);
    if (adjAct) {
        adjAct.orgId = orgObjId;
        adjAct._id = actObjId;
    }
    else
        return attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgActivity_rc.inputParaError));

    var defer = new Q.defer();
    var recruitmentPicUrls = null, picUrl = null, recruitmentUpdatedOn = null, currentOrganizer = null;
    authClient.authQuery.canSubmitOrgActivity({ 'org': orgAlias, 'sid': pack.req.session.sessionId })
    .then(function (ret) {
        if (ret && ret.auth)
            return Q.all([ dataBase.getOneActiveOrgFieldsBy({ 'alias': orgAlias }, { '_id': 1 }), dataBase.getOneActiveActFieldsBy({'_id': adjAct._id}, {'organizer': 1} ) ]);
        else
            throw expectedError(hikerJoy.constants.submitOrgActivity_rc.notAuth);
    })
    .then(function (data) {
        var org = data[0], activity = data[1];
        if (!org) //should not happen because authClient.authQuery.canSubmitOrgActivity already checked this
            throw resolveWithErrorRC(hikerJoy.constants.submitOrgActivity_rc.unKnownError);
        else if (adjAct._id && !activity)
            throw resolveWithErrorRC(hikerJoy.constants.submitOrgActivity_rc.actNotFound);
        else {
            currentOrganizer = activity ? activity.organizer : null;
            if (adjAct._id && (!adjAct.orgId || !adjAct.orgId.equals(org._id)))
                throw expectedError(hikerJoy.constants.submitOrgActivity_rc.orgIdNotMatch);
            else
                adjAct.orgId = org._id;
        }
    })
    .then(function () {
        if (hikerJoy.validate.validateNonEmptyArray(adjAct.organizer)) {
            var prms = adjAct.organizer.map(function (v) {
                var defer = new Q.defer(), organizerObjId = utility.tryConvert2ObjId(v);
                if (!organizerObjId)
                    defer.reject(new Error('invalid object id of organizer: ' + v));
                else {
                    dataBase.getOneActiveUserFieldsBy({ '_id': organizerObjId, 'special': 0 }, { '_id': 1 })
                    .then(function (user) {
                        if (user)
                            defer.resolve(user._id);
                        else
                            defer.reject(expectedError(hikerJoy.constants.submitOrgActivity_rc.organizerNotFound));
                    })
                    .fail(function (err) {
                        defer.reject(err);
                    });
                }
                return defer.promise;
            });
            return Q.all(prms);
        }
        else
            throw expectedError(hikerJoy.constants.submitOrgActivity_rc.noOrganizer);
    })
    .then(function (organizerIds) { //upload images
        adjAct.organizer = organizerIds;
        var recruitmentPicUploadPromises = dsHelper.uploadImageForHtmlPost(adjAct.recruitment) || [];
        var actPicUploadPromise = __uploadActPic(adjAct);
        return Q.all([Q.all(recruitmentPicUploadPromises), actPicUploadPromise]);
    })
    .then(function (data) {
        recruitmentPicUrls = data[0] || [];
        picUrl = data[1];
        return dataBase.updateAvailableTags(adjAct.tags);
    })
    .then(function () {
        recruitmentUpdatedOn = new Date();
        return __saveOrgAct(adjAct, recruitmentUpdatedOn);
    }) //save act
    .then(function (saveRet) {
        var rc = getRCObj(hikerJoy.constants.submitOrgActivity_rc.success);
        rc.picUrl = picUrl;
        rc.recruitmentPicUrls = recruitmentPicUrls;
        rc.recruitmentUpdatedOn = recruitmentUpdatedOn;
        if(saveRet && saveRet._id)
            rc._id = saveRet._id;
        if(saveRet && saveRet.orgId)
            rc.orgId = saveRet.orgId;
        defer.resolve(attachToPack(pack, rc));

        //system notification for organizer
        var addedOrganizer = [], removedOrganizer = [];
        if(hikerJoy.validate.validateNonEmptyArray(currentOrganizer)) {
            adjAct.organizer.forEach(function (v) {
                if(!currentOrganizer.containsObjectId(v)) addedOrganizer.push(v);
            });
            currentOrganizer.forEach(function (v) {
                if(!adjAct.organizer.containsObjectId(v)) removedOrganizer.push(v);
            });
        }
        else addedOrganizer = adjAct.organizer;
        if(hikerJoy.validate.validateNonEmptyArray(addedOrganizer)) {
            var msg = __generateMsgForOrganizerNotification(adjAct.name);
            dataBase.createUserMessageToMultiReceivers(0, addedOrganizer, msg.subject, msg.body);
        }
        if(hikerJoy.validate.validateNonEmptyArray(removedOrganizer)) {
            var msgRmv = __generateMsgForRemovedOrganizerNotification(adjAct.name);
            dataBase.createUserMessageToMultiReceivers(0, removedOrganizer, msgRmv.subject, msgRmv.body);
        }
    })
    .fail(function (err) {
        if (err.expected)
            defer.resolve(attachToPack(pack, getRCObj(err.hikerJoy_ret)));
        else {
            console.log(err.stack);
            defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.submitOrgActivity_rc.unKnownError)));
        }
    });
    return defer.promise;
};

var __uploadActPic = function (act) {
    var defer = new Q.defer();
    if (act && hikerJoy.validate.validatePicUrlInBase64(act.picUrl)) {
        var uploadReq = utility.getImagePostFormat(act.picUrl);
        dsHelper.uploadRequest([uploadReq])
        .then(function (vals) {
            if (hikerJoy.validate.validateNonEmptyArray(vals)) {
                act.picUrl = vals[0];
                defer.resolve(vals[0]);
            }
            else {
                defer.reject(new Error('__uploadActPic no return!'));
            }
        })
        .fail(function (err) {
            if (!err.expected) console.log(err.stack);
            defer.reject(err);
        })
    }
    else
        defer.resolve();
    return defer.promise;
};

var __saveOrgAct = function (act, recruitmentUpdatedOn) {
    if (!act._id) { //create a new one
        act.recruitmentUpdatedOn = act.createdOn = recruitmentUpdatedOn;
        return dataBase.insertOneAct(act);
    }
    else {
        var defer = new Q.defer();
        dataBase.updateActs({ '_id': act._id }, {
            '$set': {
                'orgId': act.orgId,
                'statusId': act.statusId,
                'name': act.name,
                'startsOn': act.startsOn,
                'endsOn': act.endsOn,
                'organizer': act.organizer,
                'intro': act.intro,
                'picUrl': act.picUrl,
                'sheet': act.sheet,
                'recruitment': act.recruitment,
                'tags': act.tags,
                'recruitmentUpdatedOn': recruitmentUpdatedOn
            }
        })
        .then(function (ct) {
            if (!ct) {
                var err = expectedError(hikerJoy.constants.submitOrgActivity_rc.actNotFound);
                defer.reject(err);
            }
            else
                defer.resolve(ct);
        })
        .fail(function (err) {
            defer.reject(err);
        });
        return defer.promise;
    }
};

var __generateMsgForOrganizerNotification = function (actName) {
    var subject = '你被邀请成为活动 ' + actName + ' 的组织者之一！';
    var body = [{
        'T': 'P', 'C': [
            { 'T': 'text', 'V': '进入“' },
            { 'T': 'A', 'V': hikerJoy.config.siteUrl + '/global/leadership', 'C': [{ 'T': 'text', 'V': '我的队伍' }] },
            { 'T': 'text', 'V': '”来协助管理活动队员们吧！ ^^' }
        ]
    }];
    return { 'subject': subject, 'body': body };
};

var __generateMsgForRemovedOrganizerNotification = function (actName) {
    var subject = '你被从活动 ' + actName + ' 的组织者名单中移除';
    var body = [{ 'T': 'text', 'V': '_(:з」∠)_ 挽尊...' }];
    return { 'subject': subject, 'body': body };
};

exports.setOrgActArchived = setOrgActArchived;
exports.setOrgActRemoved = setOrgActRemoved;
exports.submitOrgActivity = submitOrgActivity;
