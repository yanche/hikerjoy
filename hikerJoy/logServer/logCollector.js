

var mongo = require('mongodb');
var mongoServer = new mongo.Server('localhost', 27017, { auto_reconnect: true });
var config = require('hikerJoy').config;
var logDb = new mongo.Db(config.logDbName, mongoServer, { 'safe': true });
var logColl = {
    '0': {
        'level': 'critical',
        'colName': config.dbCols.log.critical,
        'col': null
    },
    '1': {
        'level': 'error',
        'colName': config.dbCols.log.error,
        'col': null
    },
    '2': {
        'level': 'warning',
        'colName': config.dbCols.log.warning,
        'col': null
    },
    '3': {
        'level': 'info',
        'colName': config.dbCols.log.info,
        'col': null
    },
    '4': {
        'level': 'debug',
        'colName': config.dbCols.log.debug,
        'col': null
    },
    '5': {
        'level': 'update',
        'colName': config.dbCols.log.update,
        'col': null
    },
    '6': {
        'level': 'pagefail',
        'colName': config.dbCols.log.page,
        'col': null
    }
};

logDb.open(function (err, db) {
    if (err)
        console.log('failed to open db for log server, err: ' + err);
    else {
        for (var i in logColl) {
            (function (idx) {
                db.collection(logColl[idx].colName, { safe: true }, function (err, col) {
                    if (err)
                        console.log('failed to get collection of: ' + logColl[idx].colName + ', err: ' + err);
                    else {
                        logColl[idx].col = col;
                    };
                });
            })(i);
        };
    };
});

var doLog = function (data) {
    try {
        try {
            //{ 'level':, 'msg':, 'obj':, 'err':, 'identifier': }
            var log = JSON.parse(data);
        }
        catch (err) {
            console.log('error when parsing JSON in log collector: ' + data);
            return;
        };

        var logPvd = logColl[log.level];
        if (!logPvd)
            throw new Error('invalid log level: ' + log.level);

        var col = logPvd.col;
        if (!col)
            throw new Error('collection of ' + logPvd.colName + ' not found.');

        col.insert({ 'createdOn': new Date(), 'level': log.level, 'msg': log.msg, 'obj': log.obj, 'err': log.err, 'identifier': log.identifier }, { 'safe': true }, function (err, data) {
            if (err)
                console.log('failed to save log, err: ' + err);
        });
    }
    catch (err) {
        console.log('error in logCollector.js, fn:doLog: ' + err);
    };
};

var collectData = function (buf, chunk) {
    chunk.push(buf);
    processData(chunk);
};

var dataEnd = function (chunk) {
    processData(chunk);
};

var processData = function (chunk) {
    if (!chunk || chunk.length == 0)
        return;

    var tmpBuf = chunk.length == 1 ? chunk[0] : Buffer.concat(chunk);
    var str = readLogFromBigBuffer(tmpBuf);
    var left = tmpBuf.slice(str.usedLen);
    chunk.splice(0, chunk.length);
    if (left.length > 0)
        chunk.push(left);
    str.retStr.forEach(function (v, k) {
        doLog(v);
    });
};

var readLogFromBigBuffer = function (buf) {
    var retStr = [];
    var bufLen = buf.length;
    var usedLen = 0, len = 0, expLen = 0, str = '';
    while (usedLen < bufLen) {
        len = buf.readUInt32BE(usedLen);
        expLen = usedLen + len + 4;
        if (expLen > bufLen)
            break;
        else {
            str = buf.toString('utf8', usedLen + 4, expLen);
            retStr.push(str);
            usedLen = expLen;
        };
    };

    return { 'retStr': retStr, 'usedLen': usedLen };
};

var collector = function (socket) {
    var chunk = [];

    //to handle timeout???
    socket.on('timeout', function () {
        console.log('log collector (at log server) timeout, socket idle now');
    });

    socket.on('error', function (err) {
        console.log('log collector (at log server) got an error, socket going to close, error: ' + err);
    });

    socket.on('close', function () {
        console.log('log collector (at log server) closed');
    });

    socket.on('data', function (buf) {
        collectData(buf, chunk);
    });

    socket.on('end', function () {
        dataEnd(chunk);
    });
};

exports.logCollector = collector;
