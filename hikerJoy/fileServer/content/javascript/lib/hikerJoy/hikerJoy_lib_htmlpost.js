//format: {'T':, 'V': 'S':, 'C':[]}
var json2jQueryObj = function (obj) {
    if (!obj || (typeof obj.T) !== 'string' || obj.T.trim().length === 0)
        return document.createTextNode('');

    var tag = obj.T.trim().toLowerCase();
    var val = (typeof obj.V) === 'string' ? obj.V.trim() : '';
    if (tag === 'text')
        return document.createTextNode(val); //HTML-escaped, could prevent javascript injection

    if (__htmlBlackList.contains(tag)) {
        return document.createTextNode(''); //dont output the tag in black list
    }
    else {
        if (__singleBraceletList.contains(tag)) {
            var ret = $('<' + tag + '/>');
            if ((typeof obj.S) === 'string' && obj.S.length > 0) {
                ret.attr('style', escapeHtml(obj.S));
            }
            if (tag === 'img') {
                ret.attr('src', val);
            }
            return ret;
        }
        else {
            var ret = $('<' + escapeHtml(tag) + '/>');
            if ((typeof obj.S) === 'string' && obj.S.length > 0) {
                ret.attr('style', escapeHtml(obj.S));
            }
            if (tag === 'a') {
                ret.attr('href', val);
            }
            if (Array.isArray(obj.C) && obj.C.length > 0) {
                obj.C.forEach(function (v, k) {
                    ret.append(json2jQueryObj(v));
                });
            }
            return ret;
        }
    }
};
var __htmlBlackList = ['script', 'form', 'link', 'head', 'body', 'html'];
var __singleBraceletList = ['br', 'hr', 'img'];

var htmlPostArrayToHtml = function (arr) {
    if(Array.isArray(arr) && arr.length > 0) {
        var tmpDiv = $('<div />');
        arr.forEach(function (v) { tmpDiv.append(json2jQueryObj(v)); });
        return tmpDiv.html();
    }
    else
        return '';
};

var replaceHtmlPostArrayImageSrc = function (arr, picUrls) {
    if(Array.isArray(arr) && arr.length > 0 && Array.isArray(picUrls) && picUrls.length > 0) {
        var len = arr.length;
        for(var i = 0; i < len; ++i) {
            var cur = arr[i];
            if(cur.T.toLowerCase() === 'img' && cur.V.toLowerCase().indexOf('data:image') === 0) {
                cur.V = picUrls.shift();
                if(picUrls.length === 0)
                    return false;
            }
            else if(Array.isArray(cur.C) && cur.C.length > 0 && !replaceHtmlPostArrayImageSrc(cur.C, picUrls))
                return false;
        }
        return true;
    }
};

//htmlSerializer
(function (jQuery) {
    var generate = function (i, v) {
        if (v.nodeValue != null) {
            return { 'T': 'text', 'V': v.nodeValue };
        }
        else {
            var obj = jQuery(v);
            var child = obj.contents().map(generate).toArray();
            var ret = { 'T': v.tagName, 'S': obj.attr('style'), 'C': child };
            if (obj.is('img')) {
                ret['V'] = obj.attr('src');
            }
            else if (obj.is('a')) {
                ret['V'] = obj.attr('href');
            }
            return ret;
        }
    };

    //input: a div with real contents
    jQuery.fn.toHtmlPostModel = function () {
        var obj = this;
        if (obj == null || obj.length > 1 || !obj.is('div'))
            return null;

        return obj.contents().map(generate).toArray();
    };

})(window.jQuery);
