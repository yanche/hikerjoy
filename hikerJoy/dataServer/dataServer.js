
var http = require('http');
var hikerJoy = require('hikerJoy');
var config = hikerJoy.config;
var port = config.ports.dataServer;
var router = require('./dataActions.js').router;
var httpHelper = require('utility').httpHelper;
var Q = require('q');
var net = require('net');
var utility = require('utility');
var queryString = require('querystring');
var authClient = require('hikerJoy_authClient');
var log = require('hikerJoy_logClient');
var refineInfo2LogFromHttpRequest = log.refineInfo2LogFromHttpRequest;
var siteUrl = config.siteUrl;
var siteUrlLen = siteUrl.length;

var server = http.createServer(function (req, res) {
    log.logInfo('hikerJoy data server request', refineInfo2LogFromHttpRequest(req), null, '1B4B1694-04ED-4E75-BE70-A2149E85045A');

    processRequest(req, res)
    .then(router)
    .then(getBody)
    .then(httpHelper.getCookie)
    .then(getSession)
    .then(checkAntiForgeryToken)
    .then(releaseDataAction)
    .then(response)
    .fail(function (err) {
        rejectWith500(err, res);
    });
});

var processRequest = function (req, res) {
    var pack = { 'req': req, 'res': res };
    var defer = new Q.defer();
    if ((typeof req.headers.referer) === 'string' && req.headers.referer.slice(0, siteUrlLen).toLowerCase() === siteUrl)
        defer.resolve(pack);
    else
        defer.reject(new Error('invalid site referer! ' + req.headers.referer));
    return defer.promise;
};

var releaseDataAction = function (pack) {
    var act = pack.req.action;
    return act(pack);
};

var response = function (pack) {
    var res = pack.res;
    res.setHeader('Content-Type', res.contentType || 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', config.siteUrl);
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.writeHead(200);
    res.end(res.content);
};

var rejectWith500 = function (err, res) {
    console.log('dataServer got error, going to reject with 500: ' + err.stack);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', config.siteUrl);
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.writeHead(500);
    res.end();
};

//input: pack {req:, res:}
//return pack.req.body, format: json obj
var getBody = function (pack) {
    var defer = new Q.defer();
    var req = pack.req;
    var body = '';
    req.on('data', function (data) { body += data; })
    .on('end', function () {
        if (body.length === 0) { // '' --> {}
            pack.req.body = {};
            defer.resolve(pack);
        }
        else {
            var parsed = utility.parseJSON(body);
            if (parsed == null)
                defer.reject(new Error('failed to parse body: ' + body));
            else {
                pack.req.body = parsed;
                defer.resolve(pack);
            }
        }
    })
    .on('error', function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

//specific for dataServer: if session not found, return 500 page to require a page re-fresh
//the session should be provider by fileServer. to avoid the cross-domain issue.
var getSession = function (pack) {
    var deferSess = new Q.defer();
    authClient.getSession({ 'sid': pack.req.cookies['sessionId'] })
    .then(function (session) {
        if (session) {
            if(session.user) session.user._id = utility.tryConvert2ObjId(session.user._id);
            pack.req.session = session;
            deferSess.resolve(pack);
        }
        else
            deferSess.reject(new Error('dataServer.js: session not found: ' + pack.req.cookies['sessionId']));
    })
    .fail(function (err) {
        console.log(err.stack);
        deferSess.reject(err);
    });
    return deferSess.promise;
};

var checkAntiForgeryToken = function (pack) {
    var defer = new Q.defer();
    var validToken = hikerJoy.token.validateToken(pack.req.body.__antiForgeryToken, pack.req.session.token);
    if(validToken)
        defer.resolve(pack);
    else
        defer.reject(new Error('anti forgery token not valid: ' + pack.req.body.__antiForgeryToken));
    return defer.promise;
};

server.on('error', function (err) {
    log.logCritical('dataServer.js server got error.', null, err, '486C4556-2F1F-47E1-94E7-17CC905E0646');
    console.log('data server got error' + err.stack);
});

server.on('listening', function () {
    console.log('data server listening at port: ' + port + '...');
});

server.listen(port);


process.on('exit', function () {
    log.logCritical('dataServer.js server exists.', null, null, 'FF5E8504-99C8-49E7-8087-FB9D64B5D4F0');
    console.log('dataServer.js exists');
});

process.on('uncaughtException', function (err) {
    log.logCritical('dataServer.js server got uncaughtException.', null, err, 'E9F57A14-48D1-49F6-A28F-D7EE228D1F53');
    console.log('dataServer.js caught exception: ' + err.stack);
});

