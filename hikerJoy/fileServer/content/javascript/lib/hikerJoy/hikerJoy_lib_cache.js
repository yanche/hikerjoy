
var _hikerJoy_cache = function () {
    this._cacheMap = {};
};

_hikerJoy_cache.prototype.validateKey = function (key) {return (typeof key) === 'string' && key.trim().length > 0; };

_hikerJoy_cache.prototype.setValue = function (key, val) {
    if(this.validateKey(key)) {
        key = key.trim();
        this._cacheMap[key] = val;
    }
};

_hikerJoy_cache.prototype.getValue = function (key) {
    if(this.validateKey(key)) {
        return this._cacheMap[key.trim()];
    }
    else return undefined;
};

_hikerJoy_cache.prototype.resetCache = function () {
    this._cacheMap = {};
};

_hikerJoy_cache.prototype.customSearch = function (searchBy, seachFn) {
    return seachFn(searchBy, this._cacheMap);
};
