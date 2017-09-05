/**
 * Created by cong on 2017/9/4.
 */
var NetUtil = require('../utils/download_util');
var FileUtil = require('../utils/file_util');
var dbUtil = require('../utils/db');
// var request = Promise.promisify(require('request'));
var prefix = {
    home:'http://vvn.78zhai.com/?json=get_recent_posts&include=id%2Ctitle%2Cdate%2Ccustom_fields%2Cmodel%2Cis_fav%2Cbuy_count%2Ccategories&custom_fields=thumb&count=5',
    baseModelPath:'/Users/cong/learn/model',
    // baseModelPath:'/home/local/model/',
    // basePicPath:'/home/local/up_to_date/'
    basePicPath:'/Users/cong/learn/up_to_date/'
}
exports.fetchData = function () {
    console.log('fetchData');
    NetUtil.curl(prefix.home).then(function (data) {
        data.posts.forEach(function (item){
            dbUtil.is_Exist_data(item.id,function (isExist){
                if(!isExist){
                    checkModel(item);
                }
            })
        })
    })
};
function checkModel(item){
    console.log('checkModel');

    dbUtil.is_Exist_model(item.model.id,function (model) {
        if(model.length>0){
            saveData(item);
        }else {
            if(item.model.portrait!=''&&item.model.portrait!=null){
                var portrait = "http://pic.78zhai.com"+"/i/WH_Phone_s/"+item.model.portrait;
                var fileName = item.model.portrait.split('/')[item.model.portrait.split('/').length-1];
                FileUtil.mkDirs(prefix.baseModelPath,function (err) {
                        var dir = prefix.baseModelPath
                        NetUtil.downloadFile(portrait,dir,fileName,function () {
                        //    下载完成之后，存储
                            var modelPicPath = {
                                path:dir+fileName
                            }
                            dbUtil.save_model(Object.assign(item.model,modelPicPath),function (model) {
                            //    下载完个人信息中的图片，直接返回，这个model
                                item.model = model;
                                saveData(item);
                            });

                        })
                    });

            }
        }
    })
}
function saveData(item) {
    console.log('saveData');

    if(item.custom_fields.thumb.length>0&&item.categories.length>0){
        var fileName = item.custom_fields.thumb[0].split('/')[item.custom_fields.thumb[0].split('/').length-1];
        var picPath = "http://pic.78zhai.com"+"/i/WH_Phone_s/"+item.custom_fields.thumb[0]
        var dir = prefix.basePicPath+item.categories[0].id+'/'+item.id;

        FileUtil.mkDirs(dir,function (err) {
            NetUtil.downloadFile(picPath,dir,fileName,function () {
                //    下载完成之后，存储
                var thumbPicPath = {
                    path:dir+fileName
                }
                item.pic = thumbPicPath;
                dbUtil.save_whole_data(item,function (wholeData) {
                    if(wholeData.length>0){
                        saveCatagoryData(item);
                    }
                })
            })

        });

    }
}
function saveCatagoryData(item){
    console.log('saveCatagoryData');
    dbUtil.save_data_catalog({dataId:item.id,catagoryId:item.categories[0].id},function (cata_data){
        console.log(cata_data);
    })
}


