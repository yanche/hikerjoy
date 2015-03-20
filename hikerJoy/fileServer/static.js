
var hikerJoy = require('hikerJoy');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
var Q = require('q');
var helper = require('utility').httpHelper;

var isStaticFile = function (reqPath) {
    try {
        return reqPath.slice(0, 8) === '/content' || pathName === '/favicon.ico';
    }
    catch (err) {
        return false;
    }
};

//return: {'content':, 'contentType':, 'contentEncoding': }
var getStaticFile = function (reqPath, acceptEncoding) {
    var inCache = readStaticFileFromCache(reqPath);
    if(inCache) return inCache;
    else {
        var defer = new Q.defer();
        var fileName = path.join(__dirname, reqPath);
        _readFile(fileName)
        .then(function (content) {
            return helper.httpEncoding(content, _getContentType(fileName), acceptEncoding);
        })
        .then(function (encoded) {
            saveStaticFileToCache(reqPath, encoded.content, encoded.contentType, encoded.contentEncoding);
            defer.resolve(encoded);
        })
        .fail(function (err) {
            defer.reject(err);
        });
        return defer.promise;
    }
};

var readStaticFileFromCache = function (reqPath) {
    if(hikerJoy.config.cacheStaticFile && isStaticFileCachable(reqPath))
        return _staticFileCache[reqPath] || null;
    else
        return null;
};

var saveStaticFileToCache = function (reqPath, content, contentType, contentEncoding) {
    if(hikerJoy.config.cacheStaticFile && isStaticFileCachable(reqPath)) {
        console.log('cache static file: ' + reqPath + (contentEncoding ? ' with encoding.' : ''));
        _staticFileCache[reqPath] = {'content': content, 'contentType': contentType, 'contentEncoding': contentEncoding };
        return true;
    }
    else
        return false;
};

var isStaticFileCachable = function (reqPath) {
    return hikerJoy.validate.validateValuedString(reqPath) && (hikerJoy.validate.stringEndsWith(reqPath, '.css') || hikerJoy.validate.stringEndsWith(reqPath, '.js'));
};

var _staticFileCache = {};

var _readFile = function (fileName) {
    var defer = new Q.defer();
    fs.readFile(fileName, function (err, content) {
        if (err)
            defer.reject(err);
        else
            defer.resolve(content);
    });
    return defer.promise;
};

var _getContentType = function (fileName) {
    var ct = 'text/plain; charset=utf-8';
    try {
        ct = mime.lookup(fileName);  //use mime to get content type for static file.
    }
    catch (err) {
        console.log('failed to get content type of: ' + fileName);
    };
    return ct;
};

exports.isStaticFile = isStaticFile;
exports.getStaticFile = getStaticFile;
