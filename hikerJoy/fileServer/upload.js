
var utility = require('utility');
var fs = require('fs');
var url = require('url');
var path = require('path');
var Q = require('q'); 

//input: [{'data':, 'type':}]
//output: ['url1', 'url2', ...]
var upload = function(input){
    if(!input || !Array.isArray(input)) {
        throw new Error('input invalid for upload.js - upload');
    }

    var pms = [];
    for(var i = 0; i < input.length; ++i) {
        pms.push(saveImage2Local(input[i]));
    }
    var defer = new Q.defer();
    Q.all(pms)
    .then(function (vals){
        defer.resolve(vals);
    })
    .fail(function (err){
        defer.reject(err);
    });
    return defer.promise;
};

//private function.
var saveImage2Local = function(fileInput){
    //input check
    if(!fileInput || !fileInput.data || !fileInput.type || (typeof fileInput.type) !== 'string'  || fileInput.type.slice(0, 6) !== 'image/')
        return null;
    var ext = fileInput.type.slice(6); //fileInput.type: image/jpeg, image/png ...
    if(!supportedImageType.contains(ext))
        return null;

    var fname = utility.getRandomWithTimestamp() + '.' + ext;
    var fsPath = path.join('fileServer/content/image', fname);
    var imgUrl = '/content/image/' + fname; 
    var defer = new Q.defer();
    fs.writeFile(fsPath, fileInput.data, 'base64', function(err){
        if(err) {
            console.log('save image: ' + err);
            defer.resolve(null); //no file saved
        }
        else {
            defer.resolve(imgUrl); //return saved file's url for website
        }
    })
    return defer.promise;
};

var supportedImageType = ['jpg', 'jpeg', 'png', 'bmp'];

exports.upload = upload;
