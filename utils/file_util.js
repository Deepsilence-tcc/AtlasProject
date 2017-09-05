/**
 * Created by cong on 2017/9/4.
 */
var fs = require('fs');
var path = require('path');

module.exports= {
    //递归创建目录 异步方法
    mkDirs:function (dirname, callback) {
        var that  = this;
        fs.exists(dirname, function (exists) {
            if (exists) {
                callback();
            } else {
                //console.log(path.dirname(dirname));
                that.mkDirs(path.dirname(dirname), function () {
                    fs.mkdir(dirname, callback);
                });
            }
        });
    },

    //递归创建目录 同步方法
    mkdirsSync:function (dirname) {
        //console.log(dirname);
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (mkdirsSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    }
}