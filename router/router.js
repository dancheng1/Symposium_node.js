var formidable = require("formidable");
var db = require("../models/db.js");
var md5 = require("../models/md5.js");
var path = require("path");
var fs = require("fs");
var gm = require("gm");

//首页
exports.showIndex = function (req, res, next) {
    //j检索数据库
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var login = false;
    }
    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("user", {username: username}, function (err, result) {
        if (result.length == 0) {
            var avatar = "moren.jpg";
        } else {
            var avatar = result[0].avatar;
        }
        res.render("index", {
            "login": login,
            "username": username,
            "flag": "index",
            "avatar": avatar,    //登录人的头像
        });
    });
}
//注册页面
exports.showRegist = function (req, res, next) {
    res.render("regist", {
        "login" : req.session.login == "1" ? true : false,
        "username" : req.session.login == "1" ? req.session.username : "",
        "flag" : "regist"
    });
}
//注册业务
exports.doRegist = function (req, res, next) {
    //判断注册
    var form = new formidable.IncomingForm();
    //执行里面的回调函数的时候，表单已经全部接受完毕了
    form.parse(req, function(err, fields, files) {
        //写入数据库
        var username = fields.username;
        var password = fields.password;
        db.find("user", {"username":username}, function (err, result) {
            if(err){
                res.send("-3"); //服务器错误
                return;
            }
            if(result.length != 0){
                res.send("-1"); //用户名被占用
                return;
            }
            //设置md5加密
            password = md5(md5(password) + "dancheng");
            db.insertOne("user", {
                "username":username,
                "password":password,
                "avatar" : "moren.jpg"
            }, function (err, result) {
                if(err){
                    res.send("-3"); //服务器错误
                    return;
                }
                req.session.login = "1";
                req.session.username = username;
                res.send("1");  //注册成功，写入session
            });
        });
    });
}
//登录页面
exports.showLogin = function (req, res, next) {
    res.render("login", {
        "login" : req.session.login == "1" ? true : false,
        "username" : req.session.login == "1" ? req.session.username : "",
        "flag" : "login"
    });
}
//登录验证
exports.doLogin = function (req, res, next) {
    //判断登录
    var form = new formidable.IncomingForm();
    //执行里面的回调函数的时候，表单已经全部接受完毕了
    form.parse(req, function(err, fields, files) {
        //写入数据库
        var username = fields.username;
        var password = fields.password;
        db.find("user", {"username":username}, function (err, result) {
            if(err){
                res.send("-3"); //服务器错误
                return;
            }
            if(result.length == 0){
                res.send("-1"); //用户名被占用
                return;
            }
            //设置md5加密
            password = md5(md5(password) + "dancheng");
            password1 = result[0].password;
            if(password != password1){
                res.send("-2");
                return;
            }
            req.session.login = "1";
            req.session.username = username;
            res.send("1");
        });
    });
}
//进入修改图片的页面
exports.showSetAvatar = function (req, res, next) {
    //此页面，必须保证登录页面
    if(req.session.login != "1"){
        res.end("非法闯入，这个页面需要登录");
        return;
    }
    res.render("setavatar", {
        "login" : true,
        "username" : req.session.username,
        "flag" : "setavatar"
    });
}
//修改图片操作
exports.doSetAvatar = function (req, res, next) {
    if(req.session.login != "1"){
        res.end("非法闯入，这个页面需要登录");
        return;
    }
    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../avatar");
    form.parse(req, function(err, fields, files) {
        var oldpath = files.tupian.path;
        var newpath = path.normalize(__dirname + "/../avatar") + "/" + req.session.username + ".jpg";
        fs.rename(oldpath, newpath, function (err) {
            if(err){
                res.send("失败");
                return;
            }
            //res.send("上传成功");
            //跳转到切得页面
            req.session.avatar = req.session.username + ".jpg";
            res.redirect("/cut");
        });
    });
}
//显示剪切页面
exports.showCut = function (req, res, next) {
    if(req.session.login != "1"){
        res.end("非法闯入，这个页面需要登录");
        return;
    }
    res.render("cut", {
        avatar : req.session.avatar
    });
}
//执行切图
exports.doCut = function(req,res,next){
    //这个页面接收几个GET请求参数
    //文件名、w、h、x、y
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./avatar/" + filename)
        .crop(w,h,x,y)
        .resize(100,100,"!")
        .write("./avatar/" + filename, function(err){
            if(err){
                console.log(err);
                res.send(err);
                return;
            }
            //更改数据库当前用户的avatar
            db.updateMany("user", {"username":req.session.username},{
                $set : {
                    "avatar" : req.session.avatar
                }
            }, function (err, result) {
                res.send("1");
            });
        });
};
//发表帖子
exports.doPost = function (req, res, next) {
    if(req.session.login != "1"){
        res.end("非法闯入，这个页面需要登录");
        return;
    }
    //用户名
    var username = req.session.username;
    var form = new formidable.IncomingForm();
    //执行里面的回调函数的时候，表单已经全部接受完毕了
    form.parse(req, function(err, fields, files) {
        //写入数据库
        var content = fields.content;
        db.insertOne("posts", {
            "username":username,
            "datetime":new Date(),
            "content" : content
        }, function (err, result) {
            if(err){
                res.send("-3"); //服务器错误
                return;
            }
            res.send("1");
        });
    });
}
//查询所有帖子
exports.getAll = function (req, res, next) {
    var page = req.query.page;
    db.findByFen("posts", {}, {"pageamount":12,"page":page,"sort":{"datetime":-1}},function (err, result) {
        res.json(result);
    });
}
//获取人员信息
exports.getUserInfo = function (req, res, next) {
    var username = req.query.username;
    db.find("user", {"username":username}, function (err, result) {
        var obj = {
            "username" : result[0].username,
            "avatar" : result[0].avatar,
            "_id" : result[0]._id
        }
        res.json(obj);
    });
}
//获取帖子总数量
exports.getTieZiAmount = function (req, res, next) {
    db.getAllCount("posts", function (count) {
        res.send(count.toString());
    });
}
//显示用户的所有帖子
exports.showUser = function (req, res, next) {
    var user = req.params["user"];
    db.findByFen("posts", {"username" : user}, {"sort":{"datetime":-1}}, function (err, result) {
        db.find("user", {"username" : user}, function (err, result1) {
            res.render("user", {
                "login" : req.session.login == "1" ? true : false,
                "username" : req.session.login == "1" ? req.session.username : "",
                "user" : user,
                "flag" : "Mytiezi",
                "tiezis" : result,
                "touxiang" : result1[0].avatar
            });
        });
    });
}
//显示错误界面
exports.showMessage = function (req, res, next) {
    res.writeHead(200, {"Content-Type":"text/html;charset=UTF-8"});
    res.end("<div style='font-size: 40px; padding-top: 40px' align='center'>请先登录，<a href='/login'>登陆</a></div>");
}
//显示所有用户
exports.showUserList = function (req, res, next) {
    db.find("user", {}, function (err, result) {
        res.render("userlist", {
            "login" : req.session.login == "1" ? true : false,
            "username" : req.session.login == "1" ? req.session.username : "",
            "flag" : "alluser",
            "alluser" : result,
        });
    });
}