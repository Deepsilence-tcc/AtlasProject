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
var storeUtil = require('../utils/store');


// var request = Promise.promisify(require('request'));
var prefix = {
    home:'http://vvn.78zhai.com/?json=get_recent_posts&include=id%2Ctitle%2Cdate%2Ccustom_fields%2Cmodel%2Cis_fav%2Cbuy_count%2Ccategories&custom_fields=thumb&count=5&page=',
    // baseModelPath:'/Users/cong/learn/local/model/',
    // basePicPath:'/Users/cong/learn/local/up_to_date/'

    // baseModelPath:"D:/project/model/",
    // basePicPath:"D:/project/up_to_date/"
    basePicPath:"/home/local/up_to_date/",
    baseModelPath:"/home/local/model/",

}
exports.fetchData = function () {
    //判断当前的数据库所有的条数

    NetUtil.curl(prefix.home).then(function (data) {
        var totalCount = 5;
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
                item.detail = '';
                dbUtil.save_whole_data(item, function (wholeData) {
                    if (wholeData) {
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

exports.fetchDetail = function () {
    //查询数据data 库 ,获取页数
    dbUtil.count_data(function (count) {
        console.log(count);
        var pageIndex = parseInt((count[0].count/1000));
        console.log(pageIndex);
        delayFetchData(pageIndex);
    })
    // NetUtil.curl(prefix.home).then(function (data) {
    //     var totalCount = 10;
    //     // var totalCount = data.count_total;
    //     var self = this;
    //     dbUtil.is_Exist_detail(function (isDetailExist) {
    //         if(!isDetailExist){
    //
    //         }
    //         if(count[0].count==totalCount){
    //             return;
    //         }else {
    //
    //             dbUtil.getData(leftCount,function (datas) {
    //                 var len = datas.length;
    //                 fetchDetailContent(datas,len);
    //             })
    //         }
    //     })
    //
    // })
}
function delayFetchData(pageIndex) {
    console.log('************************')
    console.log(pageIndex);
    if(pageIndex==0){
        return;
    }else {
        dbUtil.getData(pageIndex,function (datas) {
            var len = datas.length;

            console.log(len)
            fetchDetailContent(datas,len);

        });
        pageIndex--;
        setTimeout(function () {
            delayFetchData(pageIndex);
        },20000)
    }


}
function fetchDetailContent(datas,len){
    var self = this;
    if(len==0){
        return;
    }else {
        len--;
       if(typeof (datas[0])=='undefined'){

           //
       }else {
           var detailContentUrl ='http://vvn.78zhai.com/?json=1&include=title%2Ccustom_fields&custom_fields=Cntpic%2Cprice%2Cvideo&p=' +datas[0].id;
           NetUtil.curl(detailContentUrl).then(function (detailContent) {
               if(detailContent.post&&detailContent.post.custom_fields&&detailContent.post.custom_fields.Cntpic&&detailContent.post.custom_fields.Cntpic.length>0){
                   var picUrls = detailContent.post.custom_fields.Cntpic[0].split('|&|');
                   var finalPath = '';
                   downDetailPic(picUrls,datas[len].id,picUrls.length,'');
               }
           })
           setTimeout(function () {
               fetchDetailContent(len);
           },10000);
       }

    }
}

function downDetailPic(picUrls,dataId,len,finalPath) {
    var dir = '/home/'+dataId+'/'
    if(len==0){
        return;
    }else {
        len--;
        FileUtil.mkDirs(dir,function () {
            // var extName = Path.extname(picUrls[len]);

            var fileName = picUrls[len].split('/')[picUrls[len].split('/').length-1];
            var picPath = "http://pic.78zhai.com" + "/i/WH_Phone_s/"+picUrls[len];
            NetUtil.downloadFile(picPath,dir,fileName,function () {
                //    下载完成之后， 更新数据库
                if(len==1){
                    console.log(fileName);
                    finalPath += (dir+fileName);
                    dbUtil.saveDetail({id:dataId,path:finalPath},function (final) {
                        console.log("ok");
                    })
                }else {
                    console.log(len)
                    finalPath += (dir+fileName+'|&|');
                    console.log(finalPath);
                }
            })
        })

        setTimeout(function () {
            downDetailPic(picUrls,dataId,len,finalPath);
        },5000);
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
        result.id = item.id;
        result.title = item.title;
        result.date = item.date;
        result.buy_count = item.buy_count;
        result.is_fav = item.is_fav;
        result.custom_fields = {};
        result.categories = [];
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
            result.custom_fields.thumb=item.pic;
        }
        if(item.dId){
            var cate = {
                id:item.dId,
                title:item.cTitle,
                slug:item.slug,
                description:item.description,
                parent:item.parent,
                post_count:item.post_count
            }
            result.categories.push(cate);
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

exports.fetchDetailData=function (req,res,next) {
    dbUtil.is_Exist_detail(req.query.dataId,function (rows) {
        var resultModel ={};
        if(rows.length>0){
            resultModel.code =1;
            resultModel.post = generateDetail(rows);
            resultModel.can_view_all =false
            return res.json(resultModel);
        }else {
            resultModel.code =4;
            resultModel.post = [];
            resultModel.can_view_all =false
            return res.json(resultModel);
        }
    })
}
function generateDetail(rows) {
    var datas=[];
    rows.forEach(function (t) {
        var result = {};
        result.id = t.id;
        result.title = t.title;
        result.custom_fields = {};
        if(t.content!=null){
            result.custom_fields.Cntpic=[];
            Cntpic.push(t.content);
        }
        datas.push(result);
    })
}

exports.rank =function (req,res,next) {
    var resultModel ={};
    dbUtil.queryRankData(function (rows) {
        if(rows.length>0){
            resultModel.code=1;
            resultModel.posts=generateStruct(rows);
            return res.json(resultModel);
        }
    })
}
exports.getGodess = function (req,res,next) {
    var modelId = req.query.modelid;
    var resultModel = {};
    if(typeof modelId == 'undefined'||modelId==null||modelId==''){
        resultModel.code=5;
        resultModel.posts ={}
        return res.json(resultModel);
    }
    dbUtil.queryPerModel(parseInt(modelId),function (rows) {
        if(rows.length>0){
            resultModel.code =1;
            resultModel.model={
                name: rows[0].id1,
                portrait: rows[0].portrait,
                is_fav: rows[0].is_fav
            }
            resultModel.posts = generateGodess(rows);
            return res.json(resultModel);
        }else {
            resultModel.code=4;
            resultModel.posts ={}
            return res.json(resultModel);
        }
    })
}
function generateGodess(rows) {
    var datas = [];

    rows.forEach(function (item) {
        var result = {};

        result.id = item.id;
        result.title = item.title;
        result.date = item.date;
        result.buy_count = item.buy_count;
        result.is_fav = item.is_fav;
        result.custom_fields = {};
        result.categories = [];

        if(item.pic!=null){
            result.custom_fields.thumb=item.pic;
        }
        if(item.dId){
            var cate = {
                id:item.dId,
                title:item.cTitle,
            }
            result.categories.push(cate);
        }
        datas.push(result);

    })
    return datas;
}
exports.getModels = function (req,res,next) {
    var reqPageIndex = parseInt(req.query.pageIndex)>0?parseInt(req.query.pageIndex):1;
    var resultModel ={}
    dbUtil.queryModels(reqPageIndex,function (rows) {
        if(rows.length>0){
            resultModel.code=1;
            resultModel.model=[];
            rows.forEach(function (t) {
                var result ={};
                result.id = t.id;
                result.name = t.name;
                result.portrait = t.portrait;

                resultModel.model.push(result);
            })
            return res.json(resultModel);
        }else {
            resultModel.code=4;
            resultModel.model=[];
            return res.json(resultModel);
        }
    })

}
