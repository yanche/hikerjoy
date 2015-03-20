
Object.defineProperty(Array.prototype, 'containsOne', {
    value: function (arr) {
        try {
            var has = false;
            if (this) {
                for (var i in this) {
                    if (arr.contains(this[i])) {
                        has = true;
                        break;
                    }
                }
            }

            return has;
        }
        catch (err) {
            console.log('error in Array.prototype.containsOne, error: ' + err);
            return false;
        }
    },
    configurable: true,
    writable: true,
    enumerable: false
});

Object.defineProperty(Array.prototype, 'contains', {
    value: function (t) {
        try {
            var has = false;
            if (this) {
                for (var i in this) {
                    if (this[i] === t) {
                        has = true;
                        break;
                    }
                }
            }

            return has;
        }
        catch (err) {
            console.log('error in Array.prototype.contains, error: ' + err);
            return false;
        }
    },
    configurable: true,
    writable: true,
    enumerable: false
});

Object.defineProperty(Date.prototype, 'format', {
    value: function (fmt) {
        //author: meizz   
        var o = {
            'M+': this.getMonth() + 1,                 //月份   
            'd+': this.getDate(),                    //日   
            'h+': this.getHours(),                   //小时   
            'm+': this.getMinutes(),                 //分   
            's+': this.getSeconds(),                 //秒   
            'q+': Math.floor((this.getMonth() + 3) / 3), //季度   
            'S': this.getMilliseconds()             //毫秒   
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp('(' + k + ')').test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        return fmt;
    },
    configurable: true,
    writable: true,
    enumerable: false
});

Object.defineProperty(Date.prototype, 'utc2cn', {
    value: function () {
        return this.setHours(this.getHours() + 8);
    },
    configurable: true,
    writable: true,
    enumerable: false
});

Object.defineProperty(String.prototype, 'replaceAll', {
    value: function (s1, s2) {
        return this.replace(new RegExp(s1, 'gm'), s2);
    },
    configurable: true,
    writable: true,
    enumerable: false
});


var clone = function(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for (; i < len; i++) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object' && obj != null) {
        var out = {}, i;
        for (i in obj) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
};