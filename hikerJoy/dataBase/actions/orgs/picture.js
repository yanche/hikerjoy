
var Q = require('q');
var collections = require('dataBase_helper').collections;
var log = require('hikerJoy_logClient');
var dataBase = require('hikerJoy_dataBase');

var updateOrgBannerUrl = function (alias, url) {
    return dataBase.updateActiveOrgs({ 'alias': alias }, { '$set': { 'bannerUrl': url } });
};

var updateOrgLogoUrl = function (alias, url) {
    return dataBase.updateActiveOrgs({ 'alias': alias }, { '$set': { 'logoUrl': url } });
};

exports.updateOrgBannerUrl = updateOrgBannerUrl;
exports.updateOrgLogoUrl = updateOrgLogoUrl;
