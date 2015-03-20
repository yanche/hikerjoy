var testLocalStorageSupport = function () {
    if(!window.localStorage) return false;
    if(window.localStorage.length > 0) return true;
    var randomKey = (new Date()).getTime();
    try { //iPad has window.localStorage but quota is 0, thus nothing could be inserted
        window.localStorage.setItem(randomKey, randomKey);
    }
    catch (err) {
        window.localStorage.clear();
        return false;
    }
    window.localStorage.removeItem(randomKey);
    return true;
};

//this is a singleton
var hikerJoy_storage = new (function () {
    var _loc_support = testLocalStorageSupport();
    var _getStoredRecruitmentKey = function (actId) { return 'recruitment' + actId; };
    if (_loc_support) {
        this.getStoredRecruitment = function (actId) {
            if (!actId) return null;
            var key = _getStoredRecruitmentKey(actId);
            return tryParseJson(window.localStorage.getItem(key));
        };
        this.storeRecruitment = function (actId, recruitment, recruitmentUpdatedOn) {
            if (!actId || !Array.isArray(recruitment)) return false;
            var key = _getStoredRecruitmentKey(actId);
            try {
                window.localStorage.setItem(key, JSON.stringify({ 'actId': actId, 'recruitment': recruitment, 'recruitmentUpdatedOn': recruitmentUpdatedOn }));
            }
            catch (err) {
                if (err) {
                    if (err.code === 22 || err.name === 'QuotaExceededError') {
                        var keys = [], i = 0;
                        while (i < localStorage.length) keys.push(localStorage.key(i++));
                        err.localStorageKeys = keys;
                        err.settingKey = key;
                    }
                    reportPageFail(err);
                    localStorage.clear();
                }
                return false;
            }
            return true;
        };
        this.getStoredOrgContext = function () {
            var key = 'orgContext';
            return tryParseJson(window.localStorage.getItem(key));
        };
        this.storeOrgContext = function (context, contextUpdatedOn) {
            var key = 'orgContext';
            try {
                window.localStorage.setItem(key, JSON.stringify({ 'context': context, 'contextUpdatedOn': contextUpdatedOn }));
            }
            catch (err) {
                if (err) {
                    if (err.code === 22 || err.name === 'QuotaExceededError') {
                        var keys = [], i = 0;
                        while (i < localStorage.length) keys.push(localStorage.key(i++));
                        err.localStorageKeys = keys;
                        err.settingKey = key;
                    }
                    reportPageFail(err);
                    localStorage.clear();
                }
                return false;
            }
            return true;
        };
    }
    else {
        this.getStoredRecruitment = function (actId) { return null; };
        this.storeRecruitment = function (actId, recruitment, recruitmentUpdatedOn) { return null; };
        this.getStoredOrgContext = function () { return null; };
        this.storeOrgContext = function (context, contextUpdatedOn) { return null; };
    }
})();
