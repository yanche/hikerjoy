
var http = require('http');
var httpHelper = require('utility').httpHelper;
var Q = require('q');
var url = require('url');
var qs = require('querystring');
var utility = require('utility');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser();
var log = require('hikerJoy_logClient');
var refineInfo2LogFromHttpRequest = log.refineInfo2LogFromHttpRequest;
var config = require('hikerJoy').config;
var dataBase = require('hikerJoy_dataBase');
var handler = require('./handler.js');

var server = http.createServer(function (req, res) {
    log.logInfo('hikerJoy weixin server request', refineInfo2LogFromHttpRequest(req), null, 'EE70B1E0-BD32-40CC-B31B-63446ECBAB63');
    //this is the main logic: get content, then response
    processHttpRequest(req, res)
    .then(getBodyXML)
    .then(getData)
    .then(response)
    .fail(function (err) {
        console.log(err.stack);
        httpHelper.rejectWith500(err, res);
    });
});

var processHttpRequest = function (req, res) {
    var defer = new Q.defer();
    var urlParse = url.parse(req.url);
    if(urlParse.pathname.slice(0, 7) !== '/weixin')
        defer.reject(new Error('invalid path name for weixinServer: ' + urlParse.pathname));
    else {
        var pack = { 'req': req, 'res': res };
        pack.req.query = qs.parse(urlParse.query);
        defer.resolve(pack);
    }
    return defer.promise;
};

//input: pack {req:, res:}
//return pack.req.body, format: json obj
var getBodyXML = function (pack) {
    if(pack.req.method === 'POST') {
        var defer = new Q.defer();
        var body = '';
        pack.req.on('data', function (data) { body += data; })
        .on('end', function () {
            if(body.length === 0) { // '' --> {}
                pack.req.body = {};
                defer.resolve(pack);
            }
            else {
                xmlParser.parseString(body, function (err, ret) {
                    if(err)
                        defer.reject(err);
                    else {
                        if(!ret || !ret.xml)
                            pack.req.body = {};
                        else {
                            var adj = {};
                            for(var idx in ret.xml) {
                                adj[idx] = ret.xml[idx][0];
                            }
                            pack.req.body = adj;
                        }
                        defer.resolve(pack);
                    }
                });
            }
        })
        .on('error', function (err) {
            defer.reject(err);
        });
        return defer.promise;
    }
    else {
        pack.req.body = {};
        return pack;
    }
};

var getData = function (pack) {
    if(pack.req.query.echostr) { //for server existence test from Weixin
        pack.res.content = pack.req.query.echostr;
        pack.res.contentType = 'text/plain';
        return pack;
    }
    else {
        return handler.process(pack);
    }
};

var response = function (pack) {
    pack.res.writeHead(200, { 'Content-Type': pack.res.contentType });
    pack.res.end(pack.res.content);
};

server.on('error', function (err) {
    log.logCritical('weixinServer.js server got error.', null, err, '5E71589E-F99A-4797-AFAF-2755BA44716B');
    console.log('file server error');
    console.log(err.stack);
});

server.on('listening', function () {
    console.log('weixin server listening at port: ' + config.ports.weixinServer + '...');
});

server.listen(config.ports.weixinServer);

process.on('exit', function () {
    log.logCritical('weixinServer.js exists.', null, null, '3683C880-8D80-49EE-8CC5-DF717E7CC50D');
    console.log('weixinServer.js exists');
});

process.on('uncaughtException', function (err) {
    log.logCritical('weixinServer.js got uncaughtException.', null, err, '0CDF8834-B01D-408F-B8A1-3AF7756BA9D5');
    console.log('weixinServer.js caught exception: ' + err);
});

