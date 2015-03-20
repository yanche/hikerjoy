
var Q = require('q');
var collections = require('dataBase_helper').collections;
var mfj = require('mongo-fast-join');
var mongoJoin = new mfj();

//input: query on collection activity
//output: [ { '_id':, 'name':, 'startsOn':, 'endsOn':, 'organizer':, 'createdOn':, 'billstatement':, 'summary':, 'tags':, 'orgName' } ]
var getFeedbacks = function (queryOnAct) {
    if(!queryOnAct)
        throw new Error('invalid input for dataBase.getFeedbacks');

    var defer = new Q.defer();
    mongoJoin.query(
        collections.acts,
        queryOnAct,
        { '_id': 1, 'name': 1, 'startsOn': 1, 'endsOn': 1, 'organizer': 1, 'billstatement': 1, 'summary': 1, 'tags': 1, 'orgId': 1, 'createdOn': 1 }
    ).join({
        'joinCollection': collections.orgs,
        'leftKeys': ['orgId'],
        'rightKeys': ['_id'],
        'newKey': 'org'
    }).exec(function (err, items) {
        if (err)
            defer.reject(err);
        else {
            var retArr = items.map(function (v, k) {
                return { '_id': v._id, 'name': v.name, 'startsOn': v.startsOn, 'endsOn': v.endsOn, 'organizer': v.organizer, 'createdOn': v.createdOn, 'billstatement': v.billstatement, 'summary': v.summary, 'tags': v.tags, 'orgId': v.orgId, 'orgName': v.org.fullName };
            });
            defer.resolve(retArr);
        }
    });
    return defer.promise;
};

exports.getFeedbacks = getFeedbacks;
