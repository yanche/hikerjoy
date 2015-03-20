
var Q = require('q');
var dataBase = require('hikerJoy_dataBase');
var hikerJoy = require('hikerJoy');
var utility = require('utility');

var process = function (pack) {
    if((typeof pack.req.body.Content) === 'string')
        pack.req.body.Content = pack.req.body.Content.trim();
    var defer = new Q.defer();
    getTargetOrg(pack)
    .then(handle)
    .then(formatResponse)
    .then(function (pack) {
        defer.resolve(pack);
    })
    .fail(function (err) {
        console.log(err.stack);
        defer.reject(err);
    });
    return defer.promise;
};

//pack.req.orgObjId
var getTargetOrg = function (pack) {
    var defer = new Q.defer();
    var receiver = pack.req.body.ToUserName;
    if (!hikerJoy.validate.validateValuedString(receiver))
        defer.reject(new Error('invalid receiver: ' + receiver));
    else {
        dataBase.getOneActiveOrgFieldsBy({ 'weixinId': receiver }, { '_id': 1, 'alias': 1, 'weixinDefault': 1, 'weixinWelcome': 1, 'weixinKeywords': 1 })
        .then(function (org) {
            if (!org) {
                defer.reject(new Error('org not found with weixinId: ' + receiver));
            }
            else {
                pack.req.orgObjId = org._id;
                pack.req.orgAlias = org.alias;
                pack.req.weixinDefault = org.weixinDefault;
                pack.req.weixinWelcome = org.weixinWelcome;
                pack.req.weixinKeywords = org.weixinKeywords;
                defer.resolve(pack);
            }
        })
        .fail(function (err) {
            console.log(err.stack);
            defer.reject(err);
        });
    }
    return defer.promise;
};

var handle = function (pack) {
    var msgType = pack.req.body.MsgType, keywords = pack.req.weixinKeywords;

    //非认证的订阅号不能使用自定义菜单，无法触发event，也许某一天会开放
    if (keywords && hikerJoy.validate.validateValuedString(keywords.activities) && keywords.activities === pack.req.body.Content) {
        pack.req.body.MsgType = msgType = 'event';
        pack.req.body.EventKey = 'openActs';
    }
    else if (keywords && hikerJoy.validate.validateValuedString(keywords.intro) && keywords.intro === pack.req.body.Content) {
        pack.req.body.MsgType = msgType = 'event';
        pack.req.body.EventKey = 'intro';
    }

    if (hikerJoy.validate.validateValuedString(msgType) && msgHandlers[msgType]) {
        var handler = msgHandlers[msgType];
        return handler(pack);
    }
    else
        throw new Error('invalid msg type: ' + msgType);
};

var formatResponse = function (pack) {
    var msgType = pack.res.resObj.MsgType;
    var formatter = resHanlders[msgType];
    if (formatter)
        return formatter(pack);
    else
        throw new Error('response formatter for type: ' + msgType + ' not found');
};

var textHandler = function (pack) {
    if(pack.req.body.Content.length === 0) {   //after trimed
        pack.res.resObj = generateResObjForAutoReply(pack.req.weixinDefault, pack);
        return pack;
    }
    var defer = new Q.defer();
    dataBase.getOrgActiveWeixinsFieldsBy({ 'keywords': pack.req.body.Content }, { 'createdOn': 1, 'type': 1, 'content': 1, 'news': 1 })
    .then(function (docs) {
        if (Array.isArray(docs) && docs.length > 0)
            var reply = docs.sort(sortByCreatedOn)[0];
        else
            var reply = pack.req.weixinDefault;
        if (!reply)
            defer.reject(new Error('sorry, no reply found and either default reply'));
        else {
            pack.res.resObj = generateResObjForAutoReply(reply, pack);
            defer.resolve(pack);
        }
    })
    .fail(function (err) {
        console.log(err.stack);
        defer.reject(err);
    });
    return defer.promise;
};

var sortByCreatedOn = function (doc1, doc2) {
    return (new Date(doc2.createdOn)).getTime() - (new Date(doc1.createdOn)).getTime();
};

var generateResObjForAutoReply = function (reply, pack) {
    var ret = {};
    ret.ToUserName = pack.req.body.FromUserName;
    ret.FromUserName = pack.req.body.ToUserName;
    ret.CreateTime = pack.req.body.CreateTime;
    if (reply && reply.type === 'news') { //for those orgs applied weixin service but not filled up welcome/default reply, would be 'undefined' here
        ret.MsgType = 'news';
        ret.ArticleCount = reply.news.length > 10 ? 10 : reply.news.length; //reply.news should be an array
        ret.Articles = reply.news.slice(0, 10).map(function (v) { //first 10 at most, according to Tencent's limitation
            return {
                'Title': v.title,
                'Description': v.desc,
                'PicUrl': hikerJoy.config.siteUrl + v.picUrl,
                'Url': v.url
            };
        });
    }
    else {
        ret.MsgType = 'text';
        ret.Content = (reply && reply.content) ?  reply.content : '';
    }
    return ret;
};

var eventHandler = function (pack) {
    var defer = new Q.defer();
    var pr = eventMapping[pack.req.body.EventKey];
    if (!pr) //if not EventKey, maybe Event
        pr = eventMapping[pack.req.body.Event];

    if (pr) {
        pr(pack)
        .then(function (retObj) {
            pack.res.resObj = retObj;
            defer.resolve(pack);
        })
        .fail(function (err) {
            defer.reject(err);
        });
    }
    else
        defer.reject('cannot find proper handler');
    return defer.promise;
};

var getOrgActsInOpen = function (pack) {
    var defer = new Q.defer();
    dataBase.getActsFieldsBy({ 'orgId': pack.req.orgObjId, 'statusId': hikerJoy.constants.activityStatus.open }, { 'name': 1, 'picUrl': 1, 'intro': 1, '_id': 1, 'startsOn': 1, 'createdOn': 1 })
    .then(function (acts) {
        var ret = {};
        ret.ToUserName = pack.req.body.FromUserName;
        ret.FromUserName = pack.req.body.ToUserName;
        ret.CreateTime = pack.req.body.CreateTime;
        if (Array.isArray(acts) && acts.length > 0) {
            acts = acts.sort(function (v1, v2) { return utility.sortByDateDesc(v1, v2, 'createdOn'); })
            .sort(function (v1, v2) { return utility.sortByDateDesc(v1, v2, 'startsOn'); })
            .slice(0, 10); //first ten, according to weixin's limitation
            ret.MsgType = 'news';
            ret.ArticleCount = acts.length;
            ret.Articles = acts.map(function (v) {
                return {
                    'Title': v.name,
                    'Description': v.intro,
                    'PicUrl': hikerJoy.config.siteUrl + v.picUrl,
                    'Url': hikerJoy.config.siteUrl + '/' + pack.req.orgAlias + '/home/recruitment?activity=' + v._id.toString()
                };
            });
        }
        else { //if no opening act
            ret.MsgType = 'text';
            ret.Content = '实在抱歉，当前没有可以报名的活动 TAT';
        }
        defer.resolve(ret);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

var getOrgIntroduction = function (pack) {
    var defer = new Q.defer();
    dataBase.getOneActiveOrgFieldsBy({ '_id': pack.req.orgObjId }, { 'fullName': 1, 'logoUrl': 1, 'alias': 1 })
    .then(function (org) {
        var ret = {};
        ret.ToUserName = pack.req.body.FromUserName;
        ret.FromUserName = pack.req.body.ToUserName;
        ret.CreateTime = pack.req.body.CreateTime;
        if (org) {
            ret.MsgType = 'news';
            ret.ArticleCount = 1;
            ret.Articles = [{
                'Title': org.fullName,
                'Description': org.fullName,
                'PicUrl': hikerJoy.config.siteUrl + org.logoUrl,
                'Url': hikerJoy.config.siteUrl + '/' + org.alias + '/home/orgintro'
            }];
        }
        else { //if no opening act
            ret.MsgType = 'text';
            ret.Content = '抱歉，系统出错，无法读取组织介绍 TAT';
        }
        defer.resolve(ret);
    })
    .fail(function (err) {
        defer.reject(err);
    });
    return defer.promise;
};

var getOrgWelcomeMsg = function (pack) {
    var defer = new Q.defer();
    var ret = generateResObjForAutoReply(pack.req.weixinWelcome, pack);
    defer.resolve(ret);
    return defer.promise;
};

var msgHandlers = {
    'text': textHandler,
    'event': eventHandler
};

var eventMapping = {
    'openActs': getOrgActsInOpen,
    'intro': getOrgIntroduction,
    'subscribe': getOrgWelcomeMsg
};

var formatTextRes = function (pack) {
    var obj = pack.res.resObj;
    var msg = '';
    msg += '<ToUserName>' + cdataStr(obj.ToUserName) + '</ToUserName>';
    msg += '<FromUserName>' + cdataStr(obj.FromUserName) + '</FromUserName>';
    msg += '<CreateTime>' + obj.CreateTime + '</CreateTime>';
    msg += '<MsgType>' + cdataStr('text') + '</MsgType>';
    msg += '<Content>' + cdataStr(obj.Content) + '</Content>';
    msg = '<xml>' + msg + '</xml>';
    pack.res.content = msg;
    pack.res.contentType = 'application/xml';
    return pack;
};

var formatArticlesRes = function (pack) {
    var obj = pack.res.resObj;
    var msg = '';
    msg += '<ToUserName>' + cdataStr(obj.ToUserName) + '</ToUserName>';
    msg += '<FromUserName>' + cdataStr(obj.FromUserName) + '</FromUserName>';
    msg += '<CreateTime>' + obj.CreateTime + '</CreateTime>';
    msg += '<MsgType>' + cdataStr('news') + '</MsgType>';
    msg += '<ArticleCount>' + obj.Articles.length + '</ArticleCount>';
    var articles = obj.Articles.map(function (v) {
        var article = '<Title>' + cdataStr(v.Title) + '</Title>';
        article += '<Description>' + cdataStr(v.Description) + '</Description>';
        article += '<PicUrl>' + cdataStr(v.PicUrl) + '</PicUrl>';
        article += '<Url>' + cdataStr(v.Url) + '</Url>';
        return '<item>' + article + '</item>';
    });
    msg += '<Articles>' + articles + '</Articles>';
    msg = '<xml>' + msg + '</xml>';
    pack.res.content = msg;
    pack.res.contentType = 'application/xml';
    return pack;
};

var resHanlders = {
    'text': formatTextRes,
    'news': formatArticlesRes
};

var cdataStr = function (str) {
    return '<![CDATA[' + str + ']]>'
};

exports.process = process;
