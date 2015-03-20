
var Q = require('q');
var collections = require('dataBase_helper').collections;
var hikerJoy = require('hikerJoy');
var dataBase = require('hikerJoy_dataBase');

var upsertOrgSignupSheetTemplate = function (alias, template) {
    if (!alias || (typeof alias) !== 'string' || !template || (typeof template.name) !== 'string')
        throw new Error('invalid input for dataBase/actions/orgs.js - upsertOrgSignupSheetTemplate');

    var defer = new Q.defer();
    dataBase.updateActiveOrgs({ 'alias': alias }, { '$pull': { 'templates': { 'name': template.name } } })
    .then(function (ct) {
        return dataBase.updateActiveOrgs({ 'alias': alias }, { '$push': { 'templates': template } });
    })
    .then(function (ct2) {
        defer.resolve(ct2);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

exports.upsertOrgSignupSheetTemplate = upsertOrgSignupSheetTemplate;
