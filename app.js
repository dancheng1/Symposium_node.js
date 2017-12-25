var express = require("express");
var app = express();
var router = require("./router/router.js");
var session = require("express-session");

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

//模板引擎
app.set("view engine", "ejs");
//静态页面加载
app.use(express.static("./public"));
app.use("/avatar", express.static("./avatar"));

app.get("/", router.showIndex);
app.get("/regist", router.showRegist);
app.post("/doregist", router.doRegist);
app.get("/login", router.showLogin);
app.post("/dologin", router.doLogin);
app.get("/setavatar", router.showSetAvatar);
app.post("/dosetavatar", router.doSetAvatar);
app.get("/cut", router.showCut);
app.get("/docut", router.doCut);
app.post("/posttiezi", router.doPost);      //发表帖子
app.get("/getall", router.getAll);           //获得所有帖子
app.get("/getuserinfo", router.getUserInfo);
app.get("/gettieziamount", router.getTieZiAmount);
app.get("/user/:user", router.showUser);
app.get("/user", router.showMessage);
app.get("/userlist", router.showUserList);   //显示所有用户列表

app.listen(3000);