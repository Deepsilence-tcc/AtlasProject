/**
 * Created by cong on 2017/9/4.
 */
var fs = require('fs');

module.exports= {
    makeDir:function (dirpath,dirname) {
        //判断是否是第一次调用
        if(typeof dirname === "undefined"){
            if(fs.existsSync(dirpath)){
                return;
            }else{
                this.makeDir(dirpath,path.dirname(dirpath));
            }
        }else{
            //判断第二个参数是否正常，避免调用时传入错误参数
            if(dirname !== path.dirname(dirpath)){
                this.makeDir(dirpath);
                return;
            }
            if(fs.existsSync(dirname)){
                fs.mkdirSync(dirpath)
            }else{
                this.makeDir(dirname,path.dirname(dirname));
                fs.mkdirSync(dirpath);
            }
        }
    }
}