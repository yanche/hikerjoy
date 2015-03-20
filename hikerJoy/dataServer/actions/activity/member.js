
var utility = require('utility');
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var objectId = require('mongodb').ObjectID;
var Q = require('q');
var helper = hikerJoy.helper;
var attachToPack = helper.attachToPack;
var getRCObj = helper.getRCObj;
var expectedError = helper.expectedError;

//input: {'actIdlist':, }
//output: {'actMember': [ {'_id':, 'name':, 'startsOn':, 'endsOn':, 'sheet':, 'members': [ {'userId':, 'memberId':, 'statusId':, 'signUpOn':, 'personalInfo':, 'nickName':, 'items': } ]} ], 'operate': [] }
var getActivityMembers = function (pack) {
    var emptyRet = {}, authInfo = pack.req.session.user, actIdlist = hikerJoy.validate.adjustObjectIdArray(pack.req.body.actIdlist);
    if (!authInfo || !hikerJoy.validate.validateNonEmptyArray(actIdlist))
        return attachToPack(pack, emptyRet);

    var defer = new Q.defer(), authList = null;
    authClient.authQuery.canGetActivityMembers({'actIdlist': actIdlist, 'sid': pack.req.session.sessionId })
    .then(function (authRet) {
        authList = authRet.authList;
        var allowedActIdList = hikerJoy.validate.adjustObjectIdArray(authList.map(function (v) { return v._id; }));
        if(hikerJoy.validate.validateNonEmptyArray(authList))
            return dataBase.getActsFieldsBy({'_id': {'$in': allowedActIdList }}, {'_id': 1, 'name': 1, 'startsOn': 1, 'endsOn': 1, 'sheet': 1});
        else
            throw expectedError('no activity authorized for getActivityMembers');
    })
    .then(function (acts) {
        if(hikerJoy.validate.validateNonEmptyArray(acts)) {
            var prms = acts.map(function (oneact) {
                var deferGetMembers = new Q.defer();
                dataBase.getActivityMembersInfo(oneact._id)
                .then(function (members) {
                    oneact.members = Array.isArray(members) ? members : [];
                    deferGetMembers.resolve(oneact);
                })
                .fail(function (err) {
                    deferGetMembers.reject(err);
                });
                return deferGetMembers.promise;
            });
            return Q.all(prms);
        }
        else
            throw expectedError('no activity found for getActivityMembers');
    })
    .then(function (acts) {
        defer.resolve(attachToPack(pack, {'actMember': acts, 'operate': authList}));
    })
    .fail(function (err) {
        if(!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

exports.getActivityMembers = getActivityMembers;
