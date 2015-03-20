
var authClient = require('hikerJoy_authClient');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var helper = hikerJoy.helper;
var getRCObj = helper.getRCObj;
var attachToPack = helper.attachToPack;
var expectedError = helper.expectedError;
var objectId = require('mongodb').ObjectID;
var utility = require('utility');
var Q = require('q');

//input: query of tag (use contains)
//output: [ array of tags ]
//public access
var queryActivityTags = function (pack) {
    var emptyRet = [], query = pack.req.body.query;
    if(!hikerJoy.validate.validateValuedString(query))
        return attachToPack(pack, emptyRet);
    
    query = new RegExp(RegExp.escape(query)); //contains
    var defer = new Q.defer();
    dataBase.getTags({'name': query})
    .then(function (tags) {
        if (hikerJoy.validate.validateNonEmptyArray(tags)) {
            tags = tags.map(function (v) {return v.name;});
            defer.resolve(attachToPack(pack, tags));
        }
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

//output: [ array of tags ]
//public access
var getAllActivityTags = function (pack) {
    var emptyRet = [], defer = new Q.defer();
    dataBase.getTags({'_id': {'$exists': true }})
    .then(function (tags) {
        if (hikerJoy.validate.validateNonEmptyArray(tags)) {
            tags = tags.map(function (v) {return v.name;});
            defer.resolve(attachToPack(pack, tags));
        }
        else
            defer.resolve(attachToPack(pack, emptyRet));
    })
    .fail(function (err) {
        if (!err.expected) console.log(err.stack);
        defer.resolve(attachToPack(pack, emptyRet));
    });
    return defer.promise;
};

exports.queryActivityTags = queryActivityTags;
exports.getAllActivityTags = getAllActivityTags;
