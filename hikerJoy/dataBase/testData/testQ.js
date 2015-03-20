
var allHanlder = function(){
    var fnsArray = null;
    var callback = null;
    var error = null;
    var completes = [];
    var results = [];

    //call only once
    var allP = function (fns) {
        if(!fnsArray) {
            fnsArray = fns;
        };
    };

    var complete = function (idx, err, ret){
        if(!error && !completes[idx]) {
            if(err) {
                error = err;
                process.nextTick(function (){callback(error, null);});
            }
            else {
                completes[idx] = true;
                results[idx] = ret;
                if(isAllComplete()) {
                    process.nextTick(function (){callback(null, results);});
                };
            };
        };
    };

    var isAllComplete = function (){
        for(var i=0;i<fnsArray.length;++i) {
            if(!completes[i])
                return false;
        };
        return true;
    };

    var runAll = function(val, cb) {
        callback = cb;
        fnsArray.forEach(function(v, k) {
            process.nextTick(function(){
                v(val, function(err, ret){
                    complete(k, err, ret);
                })
            });
        });
    };

    this.promiseAll = allP; //mush run promiseAll first, no error handler here
    this.doAll = runAll; 
};

var testQ = function(){
    var fnArray = [];
    var currentIdx = null;
    var end = false;

    var then = function(fn, rej) {
        fnArray.push({'fn': fn, 'rej': rej});
        return this;
    };

    var all = function(fns, rej) {
        var allH = new allHanlder();
        allH.promiseAll(fns);
        fnArray.push({'all': allH, 'rej': rej});
        return this;
    };

    var run = function(val){
        if(fnArray.length > 0) {
            currentIdx = 0;
            work(null, val);
        };
    };

    var work = function(err, ret) {
        if(end)
            return; //ignore

        var cur = fnArray[currentIdx];
        if(!cur) {
            end = true;
            return;
        }

        if(err) {
            end = true;
            if(cur.rej) {
                process.nextTick(function(){cur.rej(err);});
            }
            else {
                throw new Erro('unhandled fail: ' + err);
            };
        }
        else {
            if(cur.fn) {
                process.nextTick(function(){cur.fn(ret, work);});
            }
            else if(cur.all) {
                process.nextTick(function(){cur.all.doAll(ret, work);});
            }
            else {
                process.nextTick(function(){work(err, ret);}); //process by next one
            };
            currentIdx += 1;
        };
    };

    this.then = then;
    this.all = all;
    this.run = run;
};

exports.testQ = testQ;