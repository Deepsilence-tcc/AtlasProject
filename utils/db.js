var mysql=require("mysql");
var config = require('../config/config');
var pool = null;

function nop(a,b,c,d,e,f,g){}

function query(sql,callback){
    pool.getConnection(function(err,conn){
        if(err){
            callback(err,null,null);
        }else{
            conn.query(sql,function(qerr,vals,fields){
                //释放连接
                conn.release();
                //事件驱动回调
                callback(qerr,vals,fields);
            });
        }
    });
};

exports.init = function(){
    pool = mysql.createPool({
        host: config.db.HOST,
        user: config.db.USER,
        password: config.db.PSWD,
        database: config.db.DB,
        port: config.db.PORT,
    });
};
//判断整体数据是否存在
exports.is_Exist_data=function (id,callback) {
    callback = callback == null? nop:callback;
    if(id == null){
        callback(false);
        return;
    }

    var sql = 'SELECT * FROM data WHERE id = ' + id ;
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else{
            if(rows.length > 0){

                callback(true);
            }
            else{
                callback(false);
            }
        }
    });
};
// 判断关系表是否存在 该条数据
exports.is_Model_Catalog_Exist=function (modelId,catagoryId,callback) {
    callback = callback == null? nop:callback;
    if(modelId == null||catagoryId==null){
        callback(false);
        return;
    }
    var sql = 'SELECT * FROM data_cata WHERE modelId = "' + modelId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(true);
            }
            else{
                callback(false);
            }
        }
    });
};
//判断是否存在model
exports.is_Exist_model=function (id,callback) {
    callback = callback == null? nop:callback;
    if(id == null){
        callback(false);
        return;
    }

    var sql = 'SELECT * FROM model WHERE id = ' + id ;
    console.log(sql);

    query(sql, function(err, rows, fields) {
        if (err) {
            callback(err);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(rows);
            }
            else{
                callback([]);
            }
        }
    });
};
//插入model
exports.save_model = function (option,callback) {
    callback = callback == null? nop:callback;
    var sql = 'INSERT INTO model(id,name,portrait,is_fav) VALUES(' + option.id + ',"' + option.name + '","'+option.path+'",'+option.is_fav+')';

    query(sql, function(err, rows, fields) {
        if (err) {
            if(err.code == 'ER_DUP_ENTRY'){
                callback(err);
                return;
            }
            callback(err);
            throw err;
        }
        else{
            callback(rows);
        }
    });
}
exports.save_whole_data = function (option,callback) {
    callback = callback == null? nop:callback;
    var sql = 'INSERT INTO data(id,title,date,is_fav,buy_count,modelId,pic) VALUES(' + option.id + ',"'+ option.title + '","'+option.date+'",'+option.is_fav+','+option.buy_count+','+option.modelId+',"'+option.pic.path+'")';
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            if(err.code == 'ER_DUP_ENTRY'){
                callback(err);
                return;
            }
            callback(err);
            throw err;
        }
        else{
            callback(rows);
        }
    });
}
exports.save_data_catalog = function (option,callback) {
    var sql = 'INSERT INTO data_cata(dataId,catagoryId) VALUES(' + option.dataId + ',' + option.catagoryId + ')';
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            if(err.code == 'ER_DUP_ENTRY'){
                callback(err);
                return;
            }
            callback(err);
            throw err;
        }
        else{
            callback(rows);
        }
    });

}





exports.query = query;
