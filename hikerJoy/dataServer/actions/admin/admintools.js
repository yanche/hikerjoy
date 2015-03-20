
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var getRCObj = helper.getRCObj;
var attachToPack = helper.attachToPack;
var expectedError = helper.expectedError;
var utility = require('utility');
var Q = require('q');
var objectId = require('mongodb').ObjectID;

//input: {'target': }
//output: {'returnCode':, 'msg': }
var userInjection = function (pack) {
    var target = pack.req.body.target;
    var defer = new Q.defer();
    authClient.userInjection({'sid': pack.req.session.sessionId, 'target': target})
    .then(function (ret) {
        defer.resolve(attachToPack(pack, ret));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, getRCObj(hikerJoy.constants.userInjection_rc.unKnownError)));
    });
    return defer.promise;
};

exports.userInjection = userInjection;
