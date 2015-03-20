
var Q = require('q');
var collections = require('dataBase_helper').collections;
var hikerJoy = require('hikerJoy');

//input: {'status':, 'from':, 'to':, 'cc':, 'bcc':, 'subject':, 'body':, 'insertedOn':, 'comments': }
var insertOneEmail = function (options) {
    var defer = new Q.defer();
    collections.emails.insert({
        'status': options.status,
        'from': options.from,
        'to': options.to,
        'cc': options.cc,
        'bcc': options.bcc,
        'subject': options.subject,
        'body': options.body,
        'insertedOn': new Date(),
        'comments': options.comments
    }, function (err, docs) {
        if(err)
            defer.reject(err);
        else
            defer.resolve(docs[0]);
    });
    return defer.promise;
};

exports.insertOneEmail = insertOneEmail;
