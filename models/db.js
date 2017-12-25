//这个模块里封装了所有对数据库的常用操作，不管数据库的什么操作，都需要连接数据库
var MongoClient = require("mongodb").MongoClient;
var setting = require("../setting.js");
function _connectDB(callback) {
    var url = setting.dburl;
    //链接数据库
    MongoClient.connect(url, function (err, db) {
        callback(err, db);
    });
}

//插入数据
exports.insertOne = function (collectionName, data, callback) {
    _connectDB(function (err, db) {
        if(err){
            callback(err, db);
            return;
        }
        db.collection(collectionName).insertOne(data, function (err, result) {
            callback(err, result);
            db.close();    //关闭数据库
        });
    });
}

//查找数据，找到所有数据
exports.find = function (collectionName, data, callback) {
    var result = [];   //结果数组
    if(arguments.length != 3){
        callback("参数不对", null);
    }
    //链接数据库
    _connectDB(function (err, db) {
        var cursor =db.collection(collectionName).find(data);
        cursor.each(function(err, doc) {
            if(err){
                callback(err, null);
                db.close();    //关闭数据库
                return;
            }
            if (doc != null) {
                result.push(doc);    //放入结果数组
            } else {
                //遍历结构，没有更多的文档了
                callback(null, result);
                db.close();    //关闭数据库
            }
        });
    });
}


//分页查找数据，找到所有数据
exports.findByFen = function (collectionName, data, C, D) {
    var result = [];   //结果数组
    if(arguments.length == 3){
        var callback = C;
        var skipnumber = 0;
        var limit = 0;
    } else if(arguments.length == 4){
        var callback = D;
        var args = C;
        var skipnumber = args.pageamount * args.page || 0;
        var limit = args.pageamount || 0;
        var sort = args.sort || {};
    } else {
        throw new Error("函数参数个数不对");
        return;
    }

    //链接数据库
    _connectDB(function (err, db) {
        var cursor =db.collection(collectionName).find(data).skip(skipnumber).limit(limit).sort(sort);
        cursor.each(function(err, doc) {
            if(err){
                callback(err, null);
                db.close();    //关闭数据库
                return;
            }
            if (doc != null) {
                result.push(doc);    //放入结果数组
            } else {
                //遍历结构，没有更多的文档了
                callback(null, result);
                db.close();    //关闭数据库
            }
        });
    });
}

//删除
exports.deleteMany = function (collectionName, data, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).deleteMany(
            data,
            function(err, results) {
                callback(err, results);
                db.close();    //关闭数据库
            }
        );
    });
}

//修改数据
exports.updateMany = function (collectionName, data1, data2, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).updateMany(
            data1,
            data2,
            function(err, results) {
                callback(err, results);
                db.close();
            });
    });
}

exports.getAllCount = function (collectionName, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).count({}).then(function (count) {
            callback(count);
            db.close();
        });
    });
}
