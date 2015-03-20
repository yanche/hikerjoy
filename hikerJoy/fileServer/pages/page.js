
var path = require('path');
var jade = require('jade');
var authClient = require('hikerJoy_authClient');
var Q = require('q');
var url = require('url');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
require('utility');

var _router = function (pack) {
    var defer = new Q.defer();
    _parseRoute(url.parse(pack.req.url).pathname.trim().toLowerCase())
    .then(function (route) {
        pack.req.route = route;
        return _checkOrgExistence(route);
    })
    .then(function () {
        return _checkAccessibility(pack);
    })
    .then(function () {
        defer.resolve(pack);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

var _parseRoute = function (pathName) {
    var defer = new Q.defer();
    if (pathName[0] === '/')
        pathName = pathName.slice(1); //   /fdu/home/routeplan --> fdu/home/routeplan
    if (pathName.length === 0)
        pathName = 'global/activities';
    var pathSet = pathName.split('/');
    var ret = {};
    if (globalPages.contains(pathSet[0])) { //global page
        ret.org = null;
        ret.dir = pathSet[0] || 'global';
        ret.sub = pathSet[1] || (pages[ret.dir] ? pages[ret.dir].default : 'index');
        if (ret.dir === 'forum')
            ret.sub += '_global';

        if (_isPage(ret.dir, ret.sub)) {
            if (pages[ret.dir]['sub'][ret.sub].cross) {
                ret.dir = 'cross';
                ret.sub = ret.sub + '_global';
            }
            defer.resolve(ret);
        }
        else {
            var err = new Error('page: ' + pathName + ' not found.');
            err.redirect = '/';
            defer.reject(err);
        }
    }
    else { //org page
        ret.org = pathSet[0];
        ret.dir = pathSet[1] || 'home';
        ret.sub = pathSet[2] || (pages[ret.dir] ? pages[ret.dir].default : 'index');
        if (ret.dir === 'forum')
            ret.sub += '_org';

        if (!orgPages.contains(ret.dir) || !_isPage(ret.dir, ret.sub)) {
            var err = new Error('page: ' + pathName + ' not found.');
            err.redirect = '/' + ret.org;
            defer.reject(err);
        }
        else {
            if (pages[ret.dir]['sub'][ret.sub].cross) {
                ret.dir = 'cross';
                ret.sub = ret.sub + '_org';
            }
            defer.resolve(ret);
        }
    };
    return defer.promise;
};

var _checkOrgExistence = function (route) {
    if (route.org != null) {
        var defer = new Q.defer();
        dataBase.getOneActiveOrgFieldsBy({ 'alias': route.org }, { '_id': 1 })
        .then(function (org) {
            if (org) {
                defer.resolve();
            }
            else { //org not exists or inactive
                var err = new Error('org: ' + route.org + ' not found.');
                err.redirect = '/';
                defer.reject(err);
            };
        })
        .fail(function (err) {
            defer.reject(err);
        });
        return defer.promise;
    }
};

var _checkAccessibility = function (pack) {
    var authInfo = pack.req.session.user, route = pack.req.route, dir = route.dir, sub = route.sub;
    var defer = new Q.defer();
    if (!authInfo && !_canVisitWithoutLogin(dir, sub)) {
        var err = new Error('cannot visit page: ' + dir + '/' + sub + ' without login.');
        err.redirect = route.org == null ? '/' : '/' + route.org;
        defer.reject(err);
    }
    else {
        if (dir === 'admin' || dir === 'manage') {
            authClient.getRole({ 'sid': pack.req.session.sessionId, 'orgAlias': route.org })
            .then(function (ret) {
                if (dir === 'admin') {
                    if (ret.auth && ret.role.contains('god'))
                        defer.resolve();
                    else {
                        var err = new Error('user not authorized to page: ' + dir);
                        err.redirect = '/'  //redirect to global page
                        defer.reject(err);
                    }
                }
                else { //dir: 'manage'
                    if (ret.auth && ret.role.containsOne(['god', 'ob', 'admin']))
                        defer.resolve();
                    else {
                        var err = new Error('user not authorized to page: ' + dir);
                        err.redirect = route.org ? '/' + route.org : '/';  //redirect to home page
                        defer.reject(err);
                    }
                }
            })
            .fail(function (err) {
                defer.reject(new Error('user failed for page: ' + dir + '. err: ' + err));
            });
        }
        else
            defer.resolve();
    }
    return defer.promise;
};

var globalPages = ['global', 'forum', 'security', 'admin', 'library'];
var orgPages = ['home', 'forum', 'manage'];
var pages = {
    'global': {
        'sub': {
            'index': { 'title': '社团组织' },
            'activities': { 'title': '当前活动' },
            'leadership': { 'title': '我的队伍', 'auth': true, 'cross': true },
            'footprint': { 'title': '足迹', 'auth': true, 'cross': true }
        },
        'default': 'activities'
    },
    'home': {
        'sub': {
            'routeplans': { 'title': '活动线路' },
            'signup': { 'title': '线路报名！' },
            'history': { 'title': '历史活动' },
            'recruitment': { 'title': '召集帖' },
            'orgintro': { 'title': '组织介绍' },
            'leadership': { 'title': '我的队伍', 'auth': true, 'cross': true },
            'footprint': { 'title': '足迹', 'auth': true, 'cross': true }
        },
        'default': 'routeplans'
    },
    'manage': {
        'sub': {
            'routeplans': { 'title': '活动线路', 'auth': true },
            'org': { 'title': '组织管理', 'auth': true },
            'feedback': { 'title': '活动总结', 'auth': true },
            'weixin': { 'title': '微信', 'auth': true },
            'forum': { 'title': '讨论区', 'auth': true }
        },
        'default': 'routeplans'
    },
    'forum': {
        'sub': {
            'index_global': { 'title': '话题' },
            'post_global': { 'title': '帖子' },
            'index_org': { 'title': '话题' },
            'post_org': { 'title': '帖子' }
        },
        'default': 'index'
    },
    'admin': {
        'sub': {
            'orgs': { 'title': '组织', 'auth': true },
            'tools': { 'title': '工具', 'auth': true },
            'share': { 'title': '分享', 'auth': true }
        },
        'default': 'orgs'
    },
    'security': {
        'sub': {
            'pwdreset': { 'title': '重置密码' }
        },
        'default': 'pwdreset'
    },
    'library': {
        'sub': {
            'index': { 'title': '户外资料库' },
            'summary': { 'title': '活动总结', 'auth': true }
        },
        'default': 'index'
    }
};

var _isPage = function (dir, sub) {
    try {
        return dir && pages[dir] && sub && pages[dir]['sub'][sub];
    }
    catch (err) {
        return false;
    }
};

var _canVisitWithoutLogin = function (dir, sub) {
    try {
        return dir && pages[dir] && sub && pages[dir]['sub'][sub] && !pages[dir]['sub'][sub].auth;
    }
    catch (err) {
        return false;
    }
};

var _render = function (pack) {
    var tokenInPage = hikerJoy.token.generateToken(pack.req.session.token);
    var compiler = _getCompiler(pack.req.route.dir, pack.req.route.sub);
    pack.res.content = compiler({ 'org': pack.req.route.org, 'token': tokenInPage, 'isMobile': hikerJoy.validate.isUserAgentMobile(pack.req.headers['user-agent']), 'timestamp': hikerJoy.config.systemStartsOn.getTime() });
    pack.res.contentType = 'text/html; charset=utf-8';
    return pack;
};

var _getCompiler = function (dir, sub) {
    if(hikerJoy.config.cachePageJade && _jadeCompilers[dir] && _jadeCompilers[dir][sub])
        return _jadeCompilers[dir][sub];
    else {
        var cpl = jade.compileFile(path.join(__dirname, dir, sub + '.jade'), {});
        if(hikerJoy.config.cachePageJade) {
            console.log('cache page jade: ' + dir + '/' + sub);
            if(!_jadeCompilers[dir]) _jadeCompilers[dir] = {};
            _jadeCompilers[dir][sub] = cpl;
        }
        return cpl;
    }
};

var _jadeCompilers = {};

exports.render = _render;
exports.router = _router;

