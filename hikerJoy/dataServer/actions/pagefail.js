
var helper = require('hikerJoy').helper;
var attachToPack = helper.attachToPack;
var log = require('hikerJoy_logClient');
var refineInfo2LogFromHttpRequest = log.refineInfo2LogFromHttpRequest;

var pageFail = function (pack) {
    var obj = {'http': refineInfo2LogFromHttpRequest(pack.req), 'session': pack.req.session};
    log.logPagefail(null, obj, pack.req.body, null);
    return attachToPack(pack, {'logged': true});
};

exports.pageFail = pageFail;
