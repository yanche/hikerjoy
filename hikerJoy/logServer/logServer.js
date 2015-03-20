
var net = require('net');
var port = require('hikerJoy').config.ports.logServer;
var collector = require('./logCollector.js').logCollector;

var server = net.createServer();

server.on('listening', function(){console.log('log server start listening at port: ' + port + '...');});

server.on('connection', function(socket) {
    new collector(socket);
});

server.on('error', function (err){
    console.log('log server error: ' + err);
});

server.on('end', function (err){
    console.log('one connection to log server is closed');
});

process.on('exit',function (){
    console.log('logServer.js exists');
});

process.on('uncaughtException',function (err){
    console.log('logServer.js caught exception: ' + err);
});

server.listen(port);
