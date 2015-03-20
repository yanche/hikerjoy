
var crypto = require('crypto');
var helper = require('hikerJoy').helper;
var attachToPack = helper.attachToPack;
var dsHelper = require('dataServer_helper');

//output: { 'n':, 'e':, 'ecp_check': md5(n+e) encrypted by signiture key }
var getRSAPublicKey = function (pack) {
    var n = dsHelper.getRSAKey().n.toString(16);
    var e = dsHelper.getRSAKey().e.toString(16);
    var md5sum = crypto.createHash('md5');
    md5sum.update(n);
    md5sum.update(e);
    var check = md5sum.digest('hex');
    var signKey = dsHelper.getSignKey();
    var ecp_check = signKey.encrypt(check);
    return attachToPack(pack, { 'n': n, 'e': e, 'ecp_check': ecp_check });
};

exports.getRSAPublicKey = getRSAPublicKey;
