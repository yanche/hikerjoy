
var Q = require('q');
var helper = require('dataBase_helper');

var getOneTag = function (filter) {
    return helper.getOneDoc(helper.collections.actTags, filter);
};

var getTags = function (filter) {
    return helper.getDocs(helper.collections.actTags, filter);
};

//input: array, must be trim string
var updateAvailableTags = function (tags) {
    if(Array.isArray(tags) && tags.length > 0) {
        var prms = tags.map(function (tag) {
            var defer = new Q.defer();
            helper.collections.actTags.update({'name': tag}, {'$set': {'name': tag}}, {'upsert': true} ,function (err, ct) {
                if(err)
                    defer.reject(err);
                else
                    defer.resolve(ct);
            });
            return defer.promise;
        });
        return Q.all(prms);
    }
};

exports.getOneTag = getOneTag;
exports.getTags = getTags;
exports.updateAvailableTags = updateAvailableTags;
