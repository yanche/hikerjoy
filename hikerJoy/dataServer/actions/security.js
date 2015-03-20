
var authPartial = require('./security/auth.js');
exports.authenticate = authPartial.authenticate;
exports.register = authPartial.register;
exports.getRole = authPartial.getRole;
exports.logout = authPartial.logout;
exports.changePwd = authPartial.changePwd;
exports.updateUserEmail = authPartial.updateUserEmail;
exports.claimPwdReset = authPartial.claimPwdReset;
exports.pwdResetRequest = authPartial.pwdResetRequest;

var cryptoPartial = require('./security/crypto.js');
exports.getRSAPublicKey = cryptoPartial.getRSAPublicKey;
