
var cp = require('child_process');
var timer = require('timers');
var dsPath = './dataServer/dataServer.js';
var fsPath = './fileServer/fileServer.js';
var logPath = './logServer/logServer.js';
var authPath = './authServer/authServer.js';
var wsPath = './weixinServer/weixinServer.js';

console.log('server.js: going to start log server.');
var dS = cp.fork(logPath);
timer.setTimeout(function () {
    console.log('server.js: going to start auth server.');
    var aS = cp.fork(authPath);
    console.log('server.js: going to start file server.');
    var fS = cp.fork(fsPath);
    console.log('server.js: going to start data server.');
    var dS = cp.fork(dsPath);
    console.log('server.js: going to start weixin server.');
    var wS = cp.fork(wsPath);
    console.log('server.js: work complete');
}, 1000);

process.on('exit',function (){
    console.log('server.js exists');
});

process.on('uncaughtException',function (err){
    console.log('server.js caught exception: ' + err);
});

