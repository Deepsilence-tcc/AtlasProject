/**
 * Created by cong on 2017/9/4.
 */
var NetUtil = require('../utils/download_util');
var FileUtil = require('../utils/file_util');
var dbUtil = require('../utils/db');
var url = require("url");
var mime = require("../utils/type").types;
var fs = require('fs');
var Path = require('path');
var Step = require('../utils/step')
var CRYPTO = require('crypto');
var HomeData = require('../model/home.data.model');


// var request = Promise.promisify(require('request'));
var prefix = {
    home:'http://vvn.78zhai.com/?json=get_recent_posts&include=id%2Ctitle%2Cdate%2Ccustom_fields%2Cmodel%2Cis_fav%2Cbuy_count%2Ccategories&custom_fields=thumb&count=100&page=',
    // baseModelPath:'/Users/cong/learn/local/model/',
    // basePicPath:'/Users/cong/learn/local/up_to_date/'

    baseModelPath:"D:/project/model/",
    basePicPath:"D:/project/up_to_date/"
    // basePicPath:"/home/local/up_to_date/",
    // baseModelPath:"/home/local/model/",

}
exports.fetchData = function () {
    //判断当前的数据库所有的条数

    NetUtil.curl(prefix.home).then(function (data) {
        var totalCount = 200;
        // var totalCount = data.count_total;
        var self = this;
        dbUtil.count_data(function (count) {
            if(count[0].count==totalCount){
                return;
            }else {
                var leftCount = parseInt((totalCount-count[0].count)/100)+1;
                fetchPageData(leftCount);
            }
        })

    })
};
function fetchPageData(leftCount) {
    var self = this;
    if(leftCount==0){
        return;
    }else {
        NetUtil.curl(prefix.home+leftCount).then(function (data) {
            leftCount--;
            data.posts.forEach(function (item){
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

            setTimeout(function () {
                console.log(leftCount);
               fetchPageData(leftCount);
            },5000);
        })
    }

}
function checkModel(item){
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
    var dir = ''
    if(item.categories==null||item.categories.length==0){
        dir = prefix.basePicPath + item.id+'/';
    }else if(item.custom_fields.thumb!=null&&item.custom_fields.thumb.length > 0&&item.id!=null){
        dir = prefix.basePicPath + item.categories[0].id + '/' + item.id+'/';
    }
    if (item.custom_fields.thumb!=null&&item.custom_fields.thumb.length > 0&&item.id!=null) {
        var fileName = item.custom_fields.thumb[0].split('/')[item.custom_fields.thumb[0].split('/').length - 1];
        var picPath = "http://pic.78zhai.com" + "/i/WH_Phone_s/" + item.custom_fields.thumb[0]
        FileUtil.mkDirs(dir, function (err) {
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
                        var detailUrl = 'http://vvn.78zhai.com/?p=" '+ item.id +' "&json=1&include=title%2Ccustom_fields&custom_fields=Cntpic%2Cprice%2Cvideo';
                        NetUtil.curl(detailUrl,function (contentDetail) {
                            if(contentDetail.custom_fields.Cntpic.length>0){
                                var detailPic = contentDetail.custom_fields.Cntpic.split('|&|');
                                var contentDir = '/home/local/'+item.id;
                                setTimeout(function () {
                                    downDetailPic(detailPic,item.id,detailPic.length,contentDir);
                                },5000);
                            }
                        })

                        if(item.custom_fields.thumb!=null&&item.custom_fields.thumb.length > 0){
                            saveCatagoryData(item);
                        }
                    }
                })
            })

        });
    }
}
function saveCatagoryData(item){
    dbUtil.save_data_catalog({dataId:item.id,catagoryId:item.categories[0].id},function (cata_data){
    })
};
function downDetailPic(picUrls,dataId,len,dir) {
    if(len==0){
        return;
    }else {
        var finalPath = '';

        FileUtil.mkDirs(dir,function () {
            len--;
            var fileName = picUrls[len].split('/')[picUrls[len].split('/').length-1];
            NetUtil.downloadFile(picUrls[len],dir,fileName,function () {
            //    下载完成之后， 更新数据库
                if(len==1){
                    finalPath += dir+fileName;
                }else {
                    fileName += dir+fileName+'|&|'
                }
            })
        })

        setTimeout(function () {
            downDetailPic(picUrls,dataId,len,dir);
        },1000);
    }
}

exports.getData=function(req,res,next){
    var resultModel ={};
    var reqPageIndex = parseInt(req.query.pageIndex)>0?parseInt(req.query.pageIndex):1;
    var reqPageSize = parseInt(req.query.pageSize)>0?parseInt(req.query.pageSize):12

    var op = {
        pageIndex:reqPageIndex,
        pageSize:reqPageSize
    };



    dbUtil.queryHomeData(op,function (rows) {

        if(rows.length>0){
            // var homeData = new HomeData(rows);
            resultModel.code=1;
            resultModel.pageIndex=reqPageIndex;
            resultModel.pageSize = reqPageSize;
            resultModel.posts=generateStruct(rows);
        }else if(rows.length==0){
            resultModel.code=4;
            resultModel.pageIndex=reqPageIndex;
            resultModel.pageSize = reqPageSize;
            resultModel.posts=rows;
        }
        return res.json(resultModel);
    })

}
generateStruct = function (rows){
    var datas = [];

    rows.forEach(function (item) {
        var result = {};

        console.log(item);
        result.id = item.id;
        result.title = item.title;
        result.date = item.date;
        result.buy_count = item.buy_count;
        result.is_fav = item.is_fav;

        if(item.id1!=null){
            result.model={
                id:item.id1,
                name:item.name,
                portrait:item.portrait,
                is_fav:item.fav,
            }
        }else {
            result.model=null
        }

        if(item.pic!=null){
            result.pic = item.pic;
        }
        datas.push(result);

    })
    return datas;
}


exports.getPic = function (req,res,next) {
    load_local_img(req,res,{});
};

var staticFileServer_CONFIG = {
    'file_expiry_time': 480,        // 缓存期限 HTTP cache expiry time, minutes
    'directory_listing': true       // 是否打开 文件 列表
};


var MIME_TYPES = {
    '.txt': 'text/plain',
    '.md': 'text/plain',
    '': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
};

MIME_TYPES['.htm'] = MIME_TYPES['.html'];

var httpEntity = {
    contentType: null,
    data: null,
    getHeaders: function (EXPIRY_TIME) {
        // 返回 HTTP Meta 的 Etag。可以了解 md5 加密方法
        var hash = CRYPTO.createHash('md5');
        //hash.update(this.data);
        //var etag = hash.digest('hex');

        return {
            'Content-Type': this.contentType,
            'Content-Length': this.data.length,
            //'Cache-Control': 'max-age=' + EXPIRY_TIME,
            //'ETag': etag
        };
    }
};


function load_local_img(request, response, params) {
    if (Path.extname(request.url) === '') {
        // connect.directory('C:/project/bigfoot')(request, response, function(){});
        // 如果 url 只是 目录 的，则列出目录
        console.log('如果 url 只是 目录 的，则列出目录');
        server500(response, '如果 url 只是 目录 的，则列出目录@todo');
    } else {
        var picUrl =request.url.substring(0,request.url.length);
        var pathname = require('url').parse(picUrl).pathname;
        // 如果 url 是 目录 + 文件名 的，则返回那个文件
        var path = pathname;

        Step(function () {
            console.log('请求 url :' + request.url + ', path : ' + pathname);
            fs.exists(path, this);
        }, function (path_exists, err) {
            if (err) {
                server500(response, '查找文件失败！');
                return;
            }
            if (path_exists) {
                fs.readFile(path, this);
            } else {
                response.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
                response.end('找不到 ' + path + '\n');
            }
        }, function (err, data) {
            if (err) {
                server500(response, '读取文件失败！');
                return;
            }
            // var extName = '.' + path.split('.').pop();
            var extName = Path.extname(path);

            var  extName = extName ? extName.slice(1) : 'unknown';
            console.log(extName);

            var extName = MIME_TYPES[extName] || 'text/plain';

            var _httpEntity = Object.create(httpEntity);
            _httpEntity.contentType = extName;
            var buData = new Buffer(data);
            //images(buData).height(100);

            var newImage;

            if (params.w && params.h) {
                newImage = images(buData).resize(Number(params.w), Number(params.h)).encode("jpg", { operation: 50 });
            } else if (params.w) {
                newImage = images(buData).resize(Number(params.w)).encode("jpg", { operation: 50 });
            } else if (params.h) {
                newImage = images(buData).resize(null, Number(params.h)).encode("jpg", { operation: 50 });
            } else {
                newImage = buData; // 原图
            }

            _httpEntity.data = newImage;

            // 命中缓存，Not Modified返回 304
            if (request.headers.hasOwnProperty('if-none-match') && request.headers['if-none-match'] === _httpEntity.ETag) {
                response.writeHead(304);
                response.end();
            } else {
                // 缓存过期时限
                var EXPIRY_TIME = (staticFileServer_CONFIG.file_expiry_time * 60).toString();

                response.writeHead(200, _httpEntity.getHeaders(EXPIRY_TIME));
                response.end(_httpEntity.data);
            }
        });
    }
}
function server500(response, msg) {
    console.log(msg);
    response.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
    response.end(msg + '\n');
}