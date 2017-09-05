/**
 * Created by cong on 2017/9/4.
 */
var fs = require('fs');
var Promise = require('bluebird');
var fetch = Promise.promisify(require('request'));
var request = require('request');
/*
 * url 网络文件地址
 * filename 文件名
 * callback 回调函数,
 * dir 为目录
 */
module.exports={
    downloadFile:function (uri,dir,filename,callback){
        var stream = fs.createWriteStream(dir+filename);
        request(uri).pipe(stream).on('close',callback);
    },
    curl:function (uri,callback) {
        return new Promise(function (resolve,reject) {
            fetch({uri:uri,json:true},function (err, response, body) {
               if(response.statusCode==200){
                   resolve(body);
               }else {
                   reject(err);
               }
            });
        })

    }
}