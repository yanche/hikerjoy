
var net = require('net');
var config = require('hikerJoy').config;

var client = new net.Socket();
client.connect({ 'port': config.ports.logServer });

client.on('error', function (err) {
    console.log('log client error: ' + err);
}).on('end', function () { //TODO: handle FIN, re-establish a connection?
    console.log('log client get FIN from server');
}).on('timeout', function () { //to handle timeout???
    console.log('log client timeout, socket idle now');
}).on('close', function () {
    console.log('log client closed');
});

var writeLog = function (log) {
    if (config.doLog) {
        if (log && log.level != null) {
            var str = JSON.stringify(log);
            var len = Buffer.byteLength(str, 'utf8');
            var buf = new Buffer(4 + len);
            buf.writeUInt32BE(len, 0);
            buf.write(str, 4, len, 'utf8');
            client.write(buf);
        }
        else
            console.log('invalid log format: ' + log);
    }
};

var logCritical = function (msg, obj, err, identifier) {
    writeLog({ 'level': 0, 'msg': msg, 'obj': obj, 'err': err, 'identifier': identifier });
};

var logError = function (msg, obj, err, identifier) {
    writeLog({ 'level': 1, 'msg': msg, 'obj': obj, 'err': err, 'identifier': identifier });
};

var logWarning = function (msg, obj, err, identifier) {
    writeLog({ 'level': 2, 'msg': msg, 'obj': obj, 'err': err, 'identifier': identifier });
};

var logInfo = function (msg, obj, err, identifier) {
    writeLog({ 'level': 3, 'msg': msg, 'obj': obj, 'err': err, 'identifier': identifier });
};

var logDebug = function (msg, obj, err, identifier) {
    writeLog({ 'level': 4, 'msg': msg, 'obj': obj, 'err': err, 'identifier': identifier });
};

var logUpdate = function (msg, obj, err, identifier) {
    writeLog({ 'level': 5, 'msg': msg, 'obj': obj, 'err': err, 'identifier': identifier });
};

var logPagefail = function (msg, obj, err, identifier) {
    writeLog({ 'level': 6, 'msg': msg, 'obj': obj, 'err': err, 'identifier': identifier });
};

var refineInfo2LogFromHttpRequest = function (req) {
    var ref = {};
    if (req) {
        if (req.headers) ref.headers = req.headers;
        if (req.url) ref.url = req.url;
        if (req.connection && req.connection.remoteAddress) ref.remoteAddress = req.connection.remoteAddress;
        if (req.method) ref.method = req.method;
    }
    return ref;
};

//exports.writeLog = writeLog;
exports.logCritical = logCritical;
exports.logError = logError;
exports.logWarning = logWarning;
exports.logInfo = logInfo;
exports.logDebug = logDebug;
exports.logUpdate = logUpdate;
exports.logPagefail = logPagefail;
exports.refineInfo2LogFromHttpRequest = refineInfo2LogFromHttpRequest;
