/**
 * Created by cong on 2017/9/4.
 */
var NetUtil = require('../utils/download_util');
var FileUtil = require('../utils/file_util');
var dbUtil = require('../utils/db');
var url = require("url");
var mime = require("../utils/type").types;
var fs = require('fs');
var path = require('path');

// var request = Promise.promisify(require('request'));
var prefix = {
    home:'http://vvn.78zhai.com/?json=get_recent_posts&include=id%2Ctitle%2Cdate%2Ccustom_fields%2Cmodel%2Cis_fav%2Cbuy_count%2Ccategories&custom_fields=thumb&count=100&page=1',
    // baseModelPath:'/Users/cong/learn/local/model/',
    // baseModelPath:"D:\\project\\model\\",
    // basePicPath:"D:\\project\\up_to_date\\"
    // basePicPath:'/Users/cong/learn/local/up_to_date/'
    basePicPath:"/home/local/up_to_date/",
    baseModelPath:"/home/local/model/",

}
exports.fetchData = function () {
    console.log('fetchData');
    //判断当前的数据库所有的条数

    NetUtil.curl(prefix.home).then(function (data) {
        // var totalCount = data.count_total;
        var totalCount = data.count_total;
        var self = this;
        dbUtil.count_data(function (count) {
            if(count[0].count==totalCount){
                return;
            }else {
                var leftCount = (totalCount-count[0].count)/100+1;
                fetchPageData(leftCount);
            }
        })

    })
};
function fetchPageData(leftCount) {
    if(leftCount==0){
        return;
    }else {
        NetUtil.curl(prefix.home+leftCount).then(function (data) {
            leftCount--;
            data.posts.forEach(function (item){data
                dbUtil.is_Exist_data(item.id,function (isExist){
                    if(!isExist){
                        if(item.model!=null){
                            checkModel(item);
                        }else {
                            saveData(item)
                        }

                    }
                })
            })
            setTimeout(fetchPageData(leftCount),10000);
        })
    }

}
function checkModel(item){
    console.log('checkModel');
    dbUtil.is_Exist_model(item.model.id,function (model) {
        if (model.id) {
            saveData(item);
        } else {
            if (item.model != null) {
                if (item.model.portrait != '' && item.model.portrait != null) {
                    dbUtil.is_Exist_model(item.model.id, function (model) {
                        if (model.length > 0) {
                            saveData(item);
                        } else {
                            if (item.model.portrait != '' && item.model.portrait != null) {
                                var portrait = "http://pic.78zhai.com" + "/i/WH_Phone_s/" + item.model.portrait;
                                var fileName = item.model.portrait.split('/')[item.model.portrait.split('/').length - 1];
                                FileUtil.mkDirs(prefix.baseModelPath, function (err) {
                                    var dir = prefix.baseModelPath
                                    NetUtil.downloadFile(portrait, dir, fileName, function () {
                                        //    下载完成之后，存储
                                        var modelPicPath = {
                                            path: dir + fileName
                                        }
                                        dbUtil.save_model(Object.assign(item.model, modelPicPath), function (model) {
                                            //    下载完个人信息中的图片，直接返回，这个model
                                            // item.model = model;
                                            saveData(item);
                                        });
                                    })
                                });

                            }
                        }
                    })
                }
            }else {
                saveData(item);
            }
        }
    });
}
function saveData(item) {
    if (item.custom_fields.thumb.length > 0 && item.categories.length > 0) {
        var fileName = item.custom_fields.thumb[0].split('/')[item.custom_fields.thumb[0].split('/').length - 1];
        var picPath = "http://pic.78zhai.com" + "/i/WH_Phone_s/" + item.custom_fields.thumb[0]
        var dir = prefix.basePicPath + item.categories[0].id + '\\' + item.id+'\\';
        FileUtil.mkDirs(dir, function (err) {
            console.log("aaaaa");
            NetUtil.downloadFile(picPath, dir, fileName, function () {
                //    下载完成之后，存储
                var thumbPicPath = {
                    path: dir + fileName
                }
                item.pic = thumbPicPath;
                if(item.model!=null){
                    item.modelId = item.model.id;
                }else {
                    item.modelId = null;
                }
                dbUtil.save_whole_data(item, function (wholeData) {
                    if (wholeData) {
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
        console.log("ok");
    })
};

exports.getData=function(req,res,next){
    var resultModel ={};
    var reqPageIndex = parseInt(req.query.pageIndex)>0?parseInt(req.query.pageIndex):1;
    var reqPageSize = parseInt(req.query.pageSize)>0?parseInt(req.query.pageSize):12

    var op = {
        pageIndex:reqPageIndex,
        pageSize:reqPageSize
    };



    dbUtil.queryHomeData(op,function (rows) {
        console.log(rows.length)

        if(rows.length>0){
            resultModel.code=1;
            resultModel.pageIndex=reqPageIndex;
            resultModel.pageSize = reqPageSize;
            resultModel.posts=rows;
        }else if(rows.length==0){
            resultModel.code=4;
            resultModel.pageIndex=reqPageIndex;
            resultModel.pageSize = reqPageSize;
            resultModel.posts=rows;
        }
        return res.json(resultModel);
    })

}


exports.getPic = function (req,res,next) {

    console.log(url.parse(req.url).pathname);
    var realPath =  url.parse(req.url).pathname;
    console.log(realPath);

    var ext = path.extname(realPath);

    ext = ext ? ext.slice(1) : 'unknown';

    fs.readFile(realPath, "binary", function(err, file) {

                if (err) {
                    res.writeHead(500, {'Content-Type': 'text/plain'});

                    res.end(err);

                } else {

                    res.writeHead(200, {'Content-Type': 'text/html'});

                    res.write(file, "binary");

                    res.end();

                }

            });

}