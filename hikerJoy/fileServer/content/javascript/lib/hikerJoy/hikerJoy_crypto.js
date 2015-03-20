
//RSA from rsa.js
var hikerJoy_signitureKey = new RSA();
hikerJoy_signitureKey.setPrivate( //this signitureKey can only be used in decryption!
    '83ccee7cbcb896afd6359649f58c428a8e9b2182426169c637a5edce5d7699d6188e24499e0dcf5b9c33f225b88a757d13e1230e6bfc2cf1b2286fd2c31dcd968e80276706684c490f2d245589437d62ed80e2de449ebb135f9812718dce359fbfdf08f3742408446ca2624740b7c267798ae2647a704866254f288fd3d994bd',
    '1', //e: '1', non sense, won't be used in the decryption.
    '3'
);

var hikerJoy_publicKey = null;
$(document).ready(function () {
    corsAjax({
        url: getDataServerRequestUrl('security', 'getRSAPublicKey'),
        success: function (data) {
            if(data && data.e && data.n && data.ecp_check) {
                var checksum = hikerJoy_signitureKey.decrypt(data.ecp_check);
                var checksum2 = hex_md5(data.n + data.e);
                if(checksum === checksum2) {
                    hikerJoy_publicKey = new RSA();
                    hikerJoy_publicKey.setPublic(data.n, data.e);
                }
                else {
                    hikerJoy_publicKey = null;
                }
            }
            else {
                hikerJoy_publicKey = null;
            }
        }
    });
});
