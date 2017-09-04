/**
 * Created by cong on 2017/9/4.
 */
var fs = require('fs');
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
    }
}