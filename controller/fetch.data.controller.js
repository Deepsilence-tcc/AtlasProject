/**
 * Created by cong on 2017/9/4.
 */
var NetUtil = require('../utils/download_util');
var FileUtil = require('../utils/file_util');
// var request = Promise.promisify(require('request'));
var prefix = {
    home:'http://vvn.78zhai.com/?json=get_recent_posts&include=id%2Ctitle%2Cdate%2Ccustom_fields%2Cmodel%2Cis_fav%2Cbuy_count%2Ccategories&custom_fields=thumb&count=100',
}

module.exports={
    fetchData:function (req,res,next) {
        NetUtil.curl(prefix.home).then(function (data) {
            var totalCount = data.count_total;
            data.posts.forEach(function (item) {
                    var portrait = "http://pic.78zhai.com"+"/i/WH_Phone_s/"+item.custom_fields.thumb[0];
                    var fileName = item.custom_fields.thumb[0].split('/')[item.custom_fields.thumb[0].split('/').length-1];
                    var dir = 'D:\\project\\'+
                    NetUtil.downloadFile(portrait,dir,fileName,function () {
                        if(item.model!=null){
                            
                        }
                    })

            })

        })
    }
}

