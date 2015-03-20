
var http = require('http');
var path = require('path');
var url = require('url');
var util = require('util');
var Q = require('q');
var net = require('net');
var httpHelper = require('utility').httpHelper;
var pageRender = require('./pages/page.js');
var uploader = require('./upload.js');
var hikerJoy = require('hikerJoy');
var config = hikerJoy.config;
var ports = config.ports;
var startsOn = config.systemStartsOn.toUTCString();
var log = require('hikerJoy_logClient');
var refineInfo2LogFromHttpRequest = log.refineInfo2LogFromHttpRequest;
var siteDomain = config.siteDomain;
var siteUrl = config.siteUrl;
var siteDomainlLen = siteDomain.length;
var authClient = require('hikerJoy_authClient');
var staticFile = require('./static.js');

var isWeixinRequest = function (req) {
    return url.parse(req.url).pathname.slice(0, 7) === '/weixin';
};

var processWeixinRequest = function (req, res) {
    var options = {
        'hostname': '127.0.0.1',
        'port': ports.weixinServer,
        'path': url.parse(req.url).path,
        'method': req.method
    };
    var weixinReq = http.request(options, function (weixinRes) {
        res.writeHead(200, { 'Content-Type': weixinRes.headers['content-type'] || 'application/xml' });
        weixinRes.on('data', function (data) {
            res.write(data);
        })
        .on('end', function () {
            res.end();
        })
        .on('error', function (err) {
            console.log('file server got error for weixinRequest-response: ' + err.stack);
            res.end();
        });
    });
    req.on('data', function (data) {
        weixinReq.write(data);
    })
    .on('end', function () {
        weixinReq.end();
    })
    .on('error', function (err) {
        console.log('file server got error for weixinRequest: ' + err.stack);
        res.end();
    });
};

var server = http.createServer(function (req, res) {
    if (isWeixinRequest(req))
        processWeixinRequest(req, res);
    else {

        //http file request
        if (config.staticFile304) {
            var ims = req.headers['if-modified-since'];
            if (ims && ims === startsOn) {
                res.setHeader('Last-Modified', startsOn)
                res.writeHead(304);
                res.end();
                return;
            }
        }
        
        log.logInfo('hikerJoy file server request', refineInfo2LogFromHttpRequest(req), null, 'F7ABA53F-88AB-45E9-B220-89052CECF464');

        //this is the main logic: get content, then response
        processHttpRequest(req, res)
        .then(getContent)
        .then(response)
        .fail(function (err) {
            if (err.redirect)
                httpHelper.rejectWith302(err.redirect, res);
            else {
                console.log(err.stack);
                httpHelper.rejectWith404(err, res);
            }
        });
    }
});

var processHttpRequest = function (req, res) {
    var defer = new Q.defer();
    var pack = { 'req': req, 'res': res };
    if ((typeof req.headers.host) === 'string' && req.headers.host.slice(0, siteDomainlLen).toLowerCase() === siteDomain)
        defer.resolve(pack);
    else {
        var err = new Error('invalid site host name: ' + req.headers.host + '! redirect to ' + siteUrl);
        err.redirect = siteUrl;
        defer.reject(err);
    }
    return defer.promise;
};

var getContent = function (pack) {
    var defer = new Q.defer();
    var reqPath = url.parse(pack.req.url).pathname;
    //for static file request, return the file content. for page request, return the page(session applied)
    if (staticFile.isStaticFile(reqPath)) {
        deferEmpty()
        .then(function () {
            return staticFile.getStaticFile(reqPath, pack.req.headers['accept-encoding'] || '');
        })
        .then(function (encoded) {
            pack.res.content = encoded.content;
            pack.res.contentType = encoded.contentType;
            pack.res.contentEncoding = encoded.contentEncoding; //could be null
            pack.res.lastModified = startsOn;
            defer.resolve(pack);
        })
        .fail(function (err) {
            defer.reject(err);
        });
    }
    else {
        console.log('page: ' + reqPath);
        deferHttpPack(pack)
        .then(httpHelper.getCookie)
        .then(function (pack) {
            var deferSess = new Q.defer();
            authClient.getOrCreateSession({ 'sid': pack.req.cookies['sessionId'] })
            .then(function (session) {
                pack.req.session = session;
                deferSess.resolve(pack);
            })
            .fail(function (err) {
                if (!err.expected) console.log(err.stack);
                deferSess.reject(err);
            });
            return deferSess.promise;
        })
        .then(pageRender.router)
        .then(pageRender.render)
        .then(function (pk) {
            defer.resolve(pk);
        })
        .fail(function (err) {
            defer.reject(err);
        });
    };
    return defer.promise;
};

var deferHttpPack = function (pack) {
    var defer = new Q.defer();
    defer.resolve(pack);
    return defer.promise;
};

var deferEmpty = function () {
    var defer = new Q.defer();
    defer.resolve();
    return defer.promise;
};

var response = function (pack) {
    httpHelper.response(pack.req, pack.res);
};

server.on('error', function (err) {
    log.logCritical('fileServer.js server got error.', null, err, 'B83C7FD5-8E40-4370-8937-877094F7C723');
    console.log('file server error' + err.stack);
});

server.on('listening', function () {
    console.log('file server listening at port: ' + ports.fileServer + '...');
});

server.listen(ports.fileServer);

var fileUploadServer = net.createServer();

fileUploadServer.on('listening', function () {
    console.log('file upload server listening at port: ' + ports.fileUpload + '...');
});

fileUploadServer.on('error', function (err) {
    log.logCritical('file upload server got error.', null, err, 'C776D299-57EF-4B68-B103-99BAF3F60BB1');
    console.log('file upload server error' + err.stack);
});

fileUploadServer.listen(ports.fileUpload);

fileUploadServer.on('connection', function (socket) {
    initialfileUploadRequest(socket)
    .then(JSON.parse)
    .then(uploader.upload)
    .then(function (val) {
        fileUploadResponse(val, socket);
    })
    .fail(function (err) {
        console.log(err.stack);
        fileUploadReject(err, socket);
    });
});

var initialfileUploadRequest = function (socket) {
    var defer = new Q.defer();
    var chunk = [];
    var target_len = 0;
    var got_len = 0;
    socket.on('data', function (data) {
        chunk.push(data);
        if (target_len == 0)
            target_len = data.readUInt32BE(0) + 4;
        got_len += data.length;
        if (got_len === target_len) {
            var buf = Buffer.concat(chunk);
            var str = buf.toString('utf8', 4, got_len);
            defer.resolve(str);
        }
    })
    .on('end', function () {
    })
    .on('error', function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

var fileUploadResponse = function (val, socket) {
    var str = JSON.stringify({ 'val': val });
    socket.end(str);
};

var fileUploadReject = function (err, socket) {
    var str = JSON.stringify({ 'err': err.toString() });
    socket.end(str);
};

process.on('exit', function () {
    log.logCritical('fileServer.js exists.', null, null, '21298767-1FE9-4251-9BD4-2690ED85D2B7');
    console.log('fileServer.js exists');
});

process.on('uncaughtException', function (err) {
    log.logCritical('fileServer.js got uncaughtException.', null, err, '990F00C5-4824-4003-8D67-9E8ECA7E5AF1');
    console.log('fileServer.js caught exception: ' + err.stack);
});

