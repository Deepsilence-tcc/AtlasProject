/**
 * Created by cong on 2017/9/4.
 */
var DownLoadUtil = require('../utils/download_util');
var FileUtil = require('../utils/file_util');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var prefix = {
    home:'http:vvn.78zhai.com/?json=get_recent_posts&include=id%2Ctitle%2Cdate%2Ccustom_fields%2Cmodel%2Cis_fav%2Cbuy_count%2Ccategories&custom_fields=thumb&page=',
}

// module.exports={
//     //http://vvn.78zhai.com/?json=get_recent_posts&include=id%2Ctitle%2Cdate%2Ccustom_fields%2Cmodel%2Cis_fav%2Cbuy_count%2Ccategories&custom_fields=thumb
//     fetchHome:function (req,res,next) {
//         for(var i=1;i<=10;i++){
//
//         }
//     }
// }
module.exports = {
    saveData:function () {
        function fetchHomeCount() {
            return new Promise(function (resolve,reject) {
                request({url: prefix.home, json: true}).then(function (response) {
                    if(status=='ok'){
                        resolve(response.count_total);
                    }
                })
            })
        }
        function fetchHomeData() {
            fetchHomeCount().then(function (count) {
                for(var i=1;i<2;i++){
                    request({url: prefix.home, json: true}).then(function (response) {
                        if(status=='ok'){
                            resolve(response.posts);
                        }
                    })
                }
            })
        }
        fetchHomeData().then(function (data) {
            data.forEach(function (item) {
                console.log(item.model.portrait);
            })
        })
    }

}
