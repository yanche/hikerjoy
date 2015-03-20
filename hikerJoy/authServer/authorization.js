
var Q = require('q');
var utility = require('utility');
var config = require('hikerJoy').config;
var dataBase = require('hikerJoy_dataBase');
var session = require('./session.js');
var log = require('hikerJoy_logClient');
var hikerJoy = require('hikerJoy');
var objectId = require('mongodb').ObjectID;
var helper = hikerJoy.helper;
var expectedError = helper.expectedError;

//input: {sid:, orgAlias:, actId}
//output: {auth: true or false, role:['god', 'ob', 'admin'...]}
var getRole = function (args) {
    var sid = args.sid, alias = args.orgAlias, actId = args.actId, ret = {}, defer = new Q.defer();
    //session.getUserInfo returns a user info or null/undefined, which means not auth
    session.getUserInfo(sid)
    .then(function (info) {
        if (!info)
            throw expectedError('user not login, sid: ' + sid);
        else {
            ret = { 'auth': true, 'role': [], 'userId': info._id };
            var special = info.special;
            if (_isGod(special))
                ret.role.push('god');
            if (_isOb(special))
                ret.role.push('ob');

            var prms = [], userObjId = info._id;
            var deferOneAdmin = new Q.defer();
            dataBase.getOneActiveOrgFieldsBy({ 'admins': userObjId }, { '_id': 1 })
            .then(function (org) {
                if (org)
                    ret.role.push('oneAdmin');
                deferOneAdmin.resolve();
            })
            .fail(function (err) {
                deferOneAdmin.reject(err);
            });
            prms.push(deferOneAdmin.promise);

            if (hikerJoy.validate.validateValuedString(alias)) {
                var deferAdmin = new Q.defer();
                dataBase.getOneActiveOrgFieldsBy({ 'alias': alias, 'admins': userObjId }, { 'admins': 1 })
                .then(function (org) {
                    if (org)
                        ret.role.push('admin');
                    deferAdmin.resolve();
                })
                .fail(function (err) {
                    deferAdmin.reject(err);
                });
                prms.push(deferAdmin.promise);
            }
            var actObjId = utility.tryConvert2ObjId(actId);
            if (actObjId) {
                var deferOrganizer = new Q.defer();
                dataBase.getOneActFieldsBy({ '_id': actObjId, 'statusId': { '$ne': hikerJoy.constants.activityStatus.removed }, 'organizer': userObjId }, { '_id': 1 })
                .then(function (act) {
                    if (act)
                        ret.role.push('organizer');
                    deferOrganizer.resolve();
                })
                .fail(function (err) {
                    deferOrganizer.reject(err);
                });
                prms.push(deferOrganizer.promise);
            }
            return Q.all(prms);
        }
    })
    .then(function () {
        defer.resolve(ret);
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var isGodOrAdminOfOrg = function (args) {
    var sid = args.sid, alias = args.org, defer = new Q.defer();
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            if (_isGod(info.special)) //if god
                defer.resolve({ 'auth': true });
            else {
                _isAdminOfOrg(alias, new objectId(info._id))
                .then(function (val) {
                    if (val)
                        defer.resolve({ 'auth': true });
                    else
                        defer.resolve({ 'auth': false });
                })
                .fail(function (err) {
                    if(!err.expected) console.log(err.stack);
                    defer.reject({ 'auth': false });
                });
            }
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'org':, 'sid':}
//output: {'auth': true/false}
var isGodOrObOrAdminOfOrg = function (args) {
    var sid = args.sid, alias = args.org, defer = new Q.defer();
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            if (_isGod(info.special) || _isOb(info.special)) //if god or ob
                defer.resolve({ 'auth': true });
            else {
                _isAdminOfOrg(alias, new objectId(info._id))
                .then(function (val) {
                    if (val)
                        defer.resolve({ 'auth': true });
                    else
                        defer.resolve({ 'auth': false });
                })
                .fail(function (err) {
                    if (!err.expected) console.log(err.stack);
                    defer.reject({ 'auth': false });
                });
            }
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'sid':}
//output: {'auth': true/false}
var isGodOrOb = function (args) {
    var sid = args.sid, defer = new Q.defer();
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            var special = info.special;
            if (_isGod(special) || _isOb(special)) //if god or ob
                defer.resolve({ 'auth': true });
            else
                defer.resolve({ 'auth': false });
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'sid':}
//output: {'auth': true/false}
var isGod = function (args) {
    var sid = args.sid, defer = new Q.defer();
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            var special = info.special;
            if (_isGod(special)) //if god
                defer.resolve({ 'auth': true });
            else
                defer.resolve({ 'auth': false });
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'sid':}
//output: {'auth': true/false}
var isGodOrObOrAdminOfAnyOrg = function (args) {
    var sid = args.sid, defer = new Q.defer();
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            var special = info.special;
            if (_isGod(special) || _isOb(special)) //if god or ob
                defer.resolve({ 'auth': true });
            else {
                dataBase.getOneActiveOrgFieldsBy({ 'admins': new objectId(info._id) }, { '_id': 1 })
                .then(function (org) {
                    if (org)
                        defer.resolve({ 'auth': true });
                    else
                        defer.resolve({ 'auth': false });
                })
                .fail(function (err) {
                    if (!err.expected) console.log(err.stack);
                    defer.resolve({ 'auth': false });
                });
            }
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
}

//input: special tag
var _isGod = function (special) {
    return special & 1;
}

//input: special tag
var _isOb = function (special) {
    return special & 2;
}

var _isAdminOfOrg = function (orgAliasOrObjId, userObjId) {
    var filter = (typeof orgAliasOrObjId) === 'string' ? { 'alias': orgAliasOrObjId, 'admins': userObjId } : { '_id': orgAliasOrObjId, 'admins': userObjId };
    var defer = new Q.defer();
    //active org
    dataBase.getOneActiveOrgFieldsBy(filter, { '_id': 1 })
    .then(function (org) {
        if (org)
            defer.resolve(true);
        else
            defer.resolve(false);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

//input: {'userActId':, 'sid':}
var canUpdateMemberStatus = function (args) {
    var userActId = args.userActId, sid = args.sid, defer = new Q.defer();
    var userActObjId = utility.tryConvert2ObjId(userActId);
    if (!userActObjId)
        return { 'auth': false };
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            if (_isGod(info.special)) //if god, org admin cannot do this
                defer.resolve({ 'auth': true });
            else {
                dataBase.getUserActsFieldsBy({ '_id': userActObjId }, { 'actId': 1 })
                .then(function (userActs) {
                    if (Array.isArray(userActs) && userActs.length === 1) {
                        var actObjId = userActs[0].actId;
                        return dataBase.getOneActFieldsBy({ '_id': actObjId, 'statusId': hikerJoy.constants.activityStatus.open, 'organizer': new objectId(info._id) }, { '_id': 1 });
                    }
                    else
                        throw expectedError('userAct with id: ' + userActId + ' not found.');
                })
                .then(function (act) {
                    if (act)
                        defer.resolve({ 'auth': true });
                    else
                        defer.resolve({ 'auth': false });
                })
                .fail(function (err) {
                    if (!err.expected) console.log(err.stack);
                    defer.resolve({ 'auth': false });
                });
            }
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'sid':, 'actId': }
var canSendEmailToActMembers = function (args) {
    var actId = args.actId, sid = args.sid, defer = new Q.defer();
    var actObjId = utility.tryConvert2ObjId(actId);
    if (!actObjId)
        return { 'auth': false };

    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            if (_isGod(info.special)) //if god, org admin cannot do this
                defer.resolve({ 'auth': true });
            else {
                dataBase.getOneActFieldsBy({ '_id': actObjId, 'statusId': { '$nin': [hikerJoy.constants.activityStatus.archived, hikerJoy.constants.activityStatus.removed] }, 'organizer': new objectId(info._id) }, { '_id': 1 })
                .then(function (act) {
                    if (act)
                        defer.resolve({ 'auth': true });
                    else
                        defer.resolve({ 'auth': false });
                })
                .fail(function (err) {
                    if (!err.expected) console.log(err.stack);
                    defer.resolve({ 'auth': false });
                });
            }
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'sid':, 'actId': }
var canSaveActBillStatementAndSummary = function (args) {
    var actId = args.actId, sid = args.sid, defer = new Q.defer();
    var actObjId = utility.tryConvert2ObjId(actId);
    if (!actObjId)
        return { 'auth': false };

    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            if (_isGod(info.special)) //if god, org admin cannot do this
                defer.resolve({ 'auth': true });
            else {
                dataBase.getOneActFieldsBy({ '_id': actObjId, 'statusId': { '$nin': [hikerJoy.constants.activityStatus.archived, hikerJoy.constants.activityStatus.removed] } }, { 'orgId': 1, 'organizer': 1 })
                .then(function (act) {
                    if (act && Array.isArray(act.organizer) && act.organizer.containsObjectId(new objectId(info._id)))
                        return true;
                    else if (act)
                        return _isAdminOfOrg(act.orgId, new objectId(info._id));
                    else
                        return false;
                })
                .then(function (ret) {
                    if (ret === true)
                        defer.resolve({ 'auth': true });
                    else
                        defer.resolve({ 'auth': false });
                })
                .fail(function (err) {
                    if (!err.expected) console.log(err.stack);
                    defer.resolve({ 'auth': false });
                });
            }
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'sid':, 'aliasORid': }
var canDoForumPost = function (args) {
    var sid = args.sid, aliasORid = args.aliasORid, defer = new Q.defer();
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) //user not login
            defer.resolve({ 'auth': false });
        else {
            var tryObjId = utility.tryConvert2ObjId(aliasORid);
            if (tryObjId)
                return dataBase.getOneActiveOrgFieldsBy({ '_id': tryObjId, 'noForumPostUserIdList': new objectId(info._id) }, { '_id': 1 });
            else
                return dataBase.getOneActiveOrgFieldsBy({ 'alias': aliasORid, 'noForumPostUserIdList': new objectId(info._id) }, { '_id': 1 });
        }
    })
    .then(function (org) {
        if (org)
            defer.resolve({ 'auth': false });
        else //if org not found, or not in noForumPostUserIdList, then user is able to do forum post
            defer.resolve({ 'auth': true });
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

var _deferVerifyOrganizerOrAdminForManagePost = function (post, userObjId) {
    var deferLeader = new Q.defer(), deferAdmin = new Q.defer();
    if (post) {
        if (post.orgId) {
            dataBase.getOneActiveOrgFieldsBy({ '_id': post.orgId, 'admins': userObjId }, { '_id': 1 })
            .then(function (org) {
                if (org)
                    deferAdmin.resolve(true);
                else
                    deferAdmin.resolve(false);
            })
            .fail(function (err) {
                if (!err.expected) console.log(err.stack);
                deferAdmin.resolve(false);
            });
        }
        else {
            deferAdmin.resolve(false);
        }
        if (post.actId) {
            dataBase.getOneActFieldsBy({ '_id': post.actId, 'organizer': userObjId }, { '_id': 1 })
            .then(function (act) {
                if (act)
                    deferLeader.resolve(true);
                else
                    deferLeader.resolve(false);
            })
            .fail(function (err) {
                if (!err.expected) console.log(err.stack);
                deferLeader.resolve(false);
            });
        }
        else {
            deferLeader.resolve(false);
        }
    }
    else {
        deferLeader.resolve(false);
        deferAdmin.resolve(false);
    }
    return Q.all([deferLeader.promise, deferAdmin.promise]);
};

//input: {'sid':, 'postId': }
var canManageForumPost = function (args) {
    var sid = args.sid, postId = args.postId, defer = new Q.defer();
    var postObjId = utility.tryConvert2ObjId(postId);
    if (!postObjId)
        return { 'auth': false };

    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            if (_isGod(info.special)) //if god, org admin cannot do this
                defer.resolve({ 'auth': true });
            else {
                dataBase.getOneActiveUserFieldsBy({ '_id': new objectId(info._id) }, { '_id': 1 })
                .then(function (user) {
                    if (user)
                        return dataBase.getOneForumPostFieldsBy({ '_id': postObjId }, { '_id': 1, 'orgId': 1, 'actId': 1 });
                    else
                        throw expectedError('user not found or inactive');
                })
                .then(function (post) {
                    return _deferVerifyOrganizerOrAdminForManagePost(post, new objectId(info._id));
                })
                .then(function (auth) {
                    if (auth[0] || auth[1]) //organizer or org admin
                        defer.resolve({ 'auth': true });
                    else
                        defer.resolve({ 'auth': false });
                })
                .fail(function (err) {
                    if (!err.expected) console.log(err.stack);
                    defer.resolve({ 'auth': false });
                });
            }
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'sid':, 'postPrmId': }
var canManageForumPostPrm = function (args) {
    var sid = args.sid, postPrmId = args.postPrmId, defer = new Q.defer();
    var postPrmObjId = utility.tryConvert2ObjId(postPrmId);
    if (!postPrmObjId)
        return { 'auth': false };

    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            if (_isGod(info.special)) //if god, org admin cannot do this
                defer.resolve({ 'auth': true });
            else {
                dataBase.getOneActiveUserFieldsBy({ '_id': new objectId(info._id) }, { '_id': 1 })
                .then(function (user) {
                    if (user)
                        return dataBase.getOneForumPostPrmFieldsBy({ '_id': postPrmObjId }, { '_id': 1, 'postId': 1 });
                    else
                        throw expectedError('user not found or inactive');
                })
                .then(function (postPrm) {
                    if (postPrm)
                        return dataBase.getOneForumPostFieldsBy({ '_id': postPrm.postId }, { '_id': 1, 'orgId': 1, 'actId': 1 });
                    else
                        throw expectedError('postPrm not found');
                })
                .then(function (post) {
                    return _deferVerifyOrganizerOrAdminForManagePost(post, new objectId(info._id));
                })
                .then(function (auth) {
                    if (auth[0] || auth[1]) //organizer or org admin
                        defer.resolve({ 'auth': true });
                    else
                        defer.resolve({ 'auth': false });
                })
                .fail(function (err) {
                    if (!err.expected) console.log(err.stack);
                    defer.resolve({ 'auth': false });
                });
            }
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};

//input: {'sid':, 'postSecId': }
var canManageForumPostSec = function (args) {
    var sid = args.sid, postSecId = args.postSecId, defer = new Q.defer();
    var postSecObjId = utility.tryConvert2ObjId(postSecId);
    if (!postSecObjId)
        return { 'auth': false };

    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null) {
            defer.resolve({ 'auth': false });
        }
        else {
            if (_isGod(info.special)) //if god
                defer.resolve({ 'auth': true });
            else {
                dataBase.getOneActiveUserFieldsBy({ '_id': new objectId(info._id) }, { '_id': 1 })
                .then(function (user) {
                    if (user)
                        return dataBase.getOneForumPostSecFieldsBy({ '_id': postSecObjId }, { '_id': 1, 'postPrmId': 1 });
                    else
                        throw expectedError('user not found or inactive');
                })
                .then(function (postSec) {
                    if (postSec)
                        return dataBase.getOneForumPostPrmFieldsBy({ '_id': postSec.postPrmId }, { '_id': 1, 'postId': 1 });
                    else
                        throw expectedError('postSec not found');
                })
                .then(function (postPrm) {
                    if (postPrm)
                        return dataBase.getOneForumPostFieldsBy({ '_id': postPrm.postId }, { '_id': 1, 'orgId': 1, 'actId': 1 });
                    else
                        throw expectedError('postPrm not found');
                })
                .then(function (post) {
                    return _deferVerifyOrganizerOrAdminForManagePost(post, new objectId(info._id));
                })
                .then(function (auth) {
                    if (auth[0] || auth[1]) //organizer or org admin
                        defer.resolve({ 'auth': true });
                    else
                        defer.resolve({ 'auth': false });
                })
                .fail(function (err) {
                    if (!err.expected) console.log(err.stack);
                    defer.resolve({ 'auth': false });
                });
            }
        }
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve({ 'auth': false });
    });
    return defer.promise;
};
var alwaysTrue = function (args) {
    return { 'auth': true };
};

//input: { 'actIdlist': [ array of actId ], 'sid': }
//output: { 'authList': [ {'actId':, 'summary': true or false, 'billstatement': true or false } ] }
var canGetActivityFeedback = function (args) {
    var actIdlist = hikerJoy.validate.adjustObjectIdArray(args.actIdlist), sid = args.sid, emptyRet = { 'authList': [] };
    if (!hikerJoy.validate.validateNonEmptyArray(actIdlist))
        return emptyRet;

    var defer = new Q.defer(), unprocessedActs = [], returnSet = [], userObjId = null;
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null)
            throw expectedError(emptyRet);
        else if (_isGod(info.special) || _isOb(info.special)) {
            var authList = actIdlist.map(function (v) { return { 'actId': v, 'summary': true, 'billstatement': true }; });
            throw expectedError({ 'authList': authList });
        }
        else {
            userObjId = info._id;
            return dataBase.getUnremovedActsFieldsBy({ '_id': { '$in': actIdlist } }, { '_id': 1, 'orgId': 1, 'organizer': 1, 'statusId': 1 });
        }
    })
    .then(function (acts) {
        if (hikerJoy.validate.validateNonEmptyArray(acts)) {
            acts.forEach(function (oneact) {
                if (hikerJoy.constants.activeActStatus.contains(oneact.statusId) && hikerJoy.validate.validateNonEmptyArray(oneact.organizer) && oneact.organizer.containsObjectId(userObjId)) //leader of active activity
                    returnSet.push({ 'actId': oneact._id, 'summary': true, 'billstatement': true });
                else
                    unprocessedActs.push(oneact);
            });
        }
        if (unprocessedActs.length === 0)
            throw expectedError({ 'authList': returnSet });
        else
            return Q.all([
                dataBase.getOrgsFieldsBy({ '_id': { '$in': unprocessedActs.map(function (v) { return v.orgId; }) } }, { '_id': 1, 'admins': 1, 'shareSummary': 1, 'shareBillStatement': 1 }),
                dataBase.getActiveOrgsFieldsBy({ 'admins': userObjId }, { '_id': 1, 'shareSummary': 1, 'shareBillStatement': 1 })
            ]);
    })
    .then(function (data) {
        var orgs = data[0], orgsAsAdmin = data[1];
        if (!hikerJoy.validate.validateNonEmptyArray(orgs) || !hikerJoy.validate.validateNonEmptyArray(orgsAsAdmin))
            throw expectedError({ 'authList': returnSet });
        var canreadSharedSummary = orgsAsAdmin.some(function (v) { return Boolean(v.shareSummary); });
        var canreadSharedBillStatement = orgsAsAdmin.some(function (v) { return Boolean(v.shareBillStatement); });
        unprocessedActs.forEach(function (oneact) {
            var matchedOrg = orgs.filter(function (oneorg) { return oneorg._id.equals(oneact.orgId); });
            if (matchedOrg.length > 0) {
                oneact.org = matchedOrg[0];
                if (hikerJoy.validate.validateNonEmptyArray(oneact.org.admins) && oneact.org.admins.containsObjectId(userObjId)) //admin of org
                    returnSet.push({ 'actId': oneact._id, 'summary': true, 'billstatement': true });
                else if ((canreadSharedSummary && oneact.org.shareSummary) || (canreadSharedBillStatement && oneact.org.shareBillStatement)) //by share documents
                    returnSet.push({ 'actId': oneact._id, 'summary': canreadSharedSummary && oneact.org.shareSummary, 'billstatement': canreadSharedBillStatement && oneact.org.shareBillStatement });
            }
        });
        defer.resolve({ 'authList': returnSet });
    })
    .fail(function (err) {
        if (!err.expected) {
            console.log(err.stack);
            defer.resolve(emptyRet);
        }
        else
            defer.resolve(err.hikerJoy_ret);
    });
    return defer.promise;
};

//input: { 'actIdlist': [ array of actId ], 'sid': }
//output: { 'authList': [ {'_id':, 'operate': } ] }
var canGetActivityMembers = function (args) {
    var actIdlist = hikerJoy.validate.adjustObjectIdArray(args.actIdlist), sid = args.sid, emptyRet = { 'authList': [] };
    if (!hikerJoy.validate.validateNonEmptyArray(actIdlist))
        return emptyRet;

    var defer = new Q.defer(), unprocessedActs = [], returnSet = [], userObjId = null;
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null)
            throw expectedError(emptyRet);
        else if (_isGod(info.special) || _isOb(info.special))
            throw expectedError({ 'authList': actIdlist.map(function (v) { return { '_id': v, 'operate': true }; }) });
        else {
            userObjId = info._id;
            return dataBase.getActiveActsFieldsBy({ '_id': { '$in': actIdlist } }, { '_id': 1, 'orgId': 1, 'organizer': 1 });
        }
    })
    .then(function (acts) {
        if (hikerJoy.validate.validateNonEmptyArray(acts)) {
            acts.forEach(function (oneact) {
                if (hikerJoy.validate.validateNonEmptyArray(oneact.organizer) && oneact.organizer.containsObjectId(userObjId)) //leader
                    returnSet.push({ '_id': oneact._id, 'operate': true });
                else
                    unprocessedActs.push(oneact);
            });
        }
        if (unprocessedActs.length === 0)
            throw expectedError({ 'authList': returnSet });
        else
            return dataBase.getActiveOrgsFieldsBy({ 'admins': userObjId }, { '_id': 1 });
    })
    .then(function (orgsAsAdmin) {
        if (hikerJoy.validate.validateNonEmptyArray(orgsAsAdmin)) {
            orgsAsAdmin = orgsAsAdmin.map(function (v) { return v._id; });
            unprocessedActs.forEach(function (oneact) {
                if (orgsAsAdmin.containsObjectId(oneact.orgId))
                    returnSet.push({ '_id': oneact._id, 'operate': false });
            });
        }
        defer.resolve({ 'authList': returnSet });
    })
    .fail(function (err) {
        if (!err.expected) {
            console.log(err.stack);
            defer.resolve(emptyRet);
        }
        else
            defer.resolve(err.hikerJoy_ret);
    });
    return defer.promise;
};

//input: { 'memberIdlist': [ array of memberId(userActs._id) ], 'sid': }
//output: { 'authList': [ array of id ] }
var canSendEmailToActivityMembers = function (args) {
    var memberIdlist = hikerJoy.validate.adjustObjectIdArray(args.memberIdlist), sid = args.sid, emptyRet = { 'authList': [] };
    if (!hikerJoy.validate.validateNonEmptyArray(memberIdlist))
        return emptyRet;

    var defer = new Q.defer(), userObjId = null;
    session.getUserInfo(sid)
    .then(function (info) {
        if (info == null)
            throw expectedError(emptyRet);
        else if (_isGod(info.special)) //god can send email to anyone
            throw expectedError({ 'authList': memberIdlist });
        else {
            userObjId = info._id;
            return dataBase.getActiveActsFieldsBy({ 'organizer': userObjId }, { '_id': 1 });
        }
    })
    .then(function (acts) {
        if (hikerJoy.validate.validateNonEmptyArray(acts))
            return dataBase.getUserActsFieldsBy({ 'actId': { '$in': acts.map(function (v) { return v._id; }) }, '_id': { '$in': memberIdlist } }, { '_id': 1 });
        else
            throw expectedError(emptyRet);
    })
    .then(function (members) {
        if (hikerJoy.validate.validateNonEmptyArray(members))
            defer.resolve({ 'authList': members.map(function (m) { return m._id; }) });
        else
            defer.resolve(emptyRet);
    })
    .fail(function (err) {
        if (!err.expected) {
            console.log(err.stack);
            defer.resolve(emptyRet);
        }
        else
            defer.resolve(err.hikerJoy_ret);
    });
    return defer.promise;
};

exports.getRole = getRole;
exports.canUpdateOrgPic = isGodOrAdminOfOrg;
exports.canGetOrgActiveActs = isGodOrObOrAdminOfOrg;
exports.canSubmitOrgActivity = isGodOrAdminOfOrg;
exports.canGrantOrgAdmin = isGodOrAdminOfOrg;
exports.canSetOrgActivityArchived = isGodOrAdminOfOrg;
exports.canSetOrgActivityRemoved = isGodOrAdminOfOrg;
exports.canGetOrgAdmins = isGodOrObOrAdminOfOrg;
exports.canRemoveOrgAdmin = isGodOrAdminOfOrg;
exports.canGetUsersInfo = isGodOrObOrAdminOfAnyOrg;
exports.canUpdateMemberStatus = canUpdateMemberStatus;
exports.canGetOrgAliasAvailability = isGodOrOb;
exports.canReactivateOrg = isGod;
exports.canDisactivateOrg = isGod;
exports.canUpdateOrgBasicInfo = isGod;
exports.canCreateNewOrg = isGod;
exports.canSaveActBillStatement = canSaveActBillStatementAndSummary;
exports.canSaveActSummary = canSaveActBillStatementAndSummary;
exports.canGetOrgAllFeedbacks = isGodOrObOrAdminOfOrg;
exports.canGetSharedFeedbacks = isGodOrObOrAdminOfAnyOrg;
exports.canRemoveActFromDB = isGod;
exports.canSetOrgShareState = isGodOrAdminOfOrg;
exports.canDoForumPost = canDoForumPost;
exports.canDisactivateForumPost = canManageForumPost;
exports.canActivateForumPost = canManageForumPost;
exports.canEmphasizePost = canManageForumPost;
exports.canFadeoutPost = canManageForumPost;
exports.canUpdatePostTags = canManageForumPost;
exports.canUpdatePostLabel = canManageForumPost;
exports.canDisactivateForumPostPrm = canManageForumPostPrm;
exports.canActivateForumPostPrm = canManageForumPostPrm;
exports.canDisactivateForumPostSec = canManageForumPostSec;
exports.canActivateForumPostSec = canManageForumPostSec;
exports.canUnauthorizeUserToPost = isGodOrAdminOfOrg;
exports.canAuthorizeUserToPost = isGodOrAdminOfOrg;
exports.canGetForumUnauthorizedUsers = isGodOrObOrAdminOfOrg;



//activity
exports.canGetAllActiveActs = isGodOrOb;
exports.canGetActivityMembers = canGetActivityMembers;
exports.canSendEmailToActivityMembers = canSendEmailToActivityMembers;

//feedback
exports.canGetActivityFeedback = canGetActivityFeedback;

//org
exports.canGetOrgWeixinId = isGodOrObOrAdminOfOrg;
exports.canSubmitOrgWeixinId = isGodOrAdminOfOrg;
exports.canGetOrgWeixinReplies = isGodOrObOrAdminOfOrg;
exports.canSubmitOrgWeixinReply = isGodOrAdminOfOrg;
exports.canArchiveOrgWeixinReply = isGodOrAdminOfOrg;
exports.canUpdateOrgIntro = isGodOrAdminOfOrg;
exports.canGetOrgActTemplates = isGodOrObOrAdminOfOrg;
exports.canUpsertOrgSignupSheetTemplate = isGodOrAdminOfOrg;
exports.canRenameOrgSignupSheetTemplate = isGodOrAdminOfOrg;
exports.canDeleteOrgSignupSheetTemplate = isGodOrAdminOfOrg;
exports.canGetOrgShareStatus = isGodOrObOrAdminOfOrg;
exports.canGetOrgWeixinKeywords = isGodOrObOrAdminOfOrg;
exports.canSubmitOrgWeixinKeywords = isGodOrAdminOfOrg;

//share
exports.canGetSharingOrgs = isGodOrObOrAdminOfAnyOrg;
