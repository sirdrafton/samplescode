var express = require('express');
var router = express.Router();
var _ = require("underscore");
var bot_vars = require('../config/bot.vars') ;
var admin_data_handler 	= require('../utilities/admin.data.handler');
var aws_urls = bot_vars.aws_libs_buckets() ;

//admin post routes
router.post('/getfanpageusers', function(req, res, next) {
    //return data as json
    let data  = (req.body.data) ? req.body.data : req.body;
    data = _.isObject(data) ? data : JSON.parse(data);
    admin_data_handler.get_fanpage_users(data, function(err, results){
        res.send(results) ;
    });
}) ;

router.post('/getalluseractivity', function(req, res, next) {
    let data  = (req.body.data) ? req.body.data : req.body;
    data = _.isObject(data) ? data : JSON.parse(data);
    admin_data_handler.get_user_activity(data, function(err, results){
        res.send(results) ;
    }) ;
}) ;

router.post('/removeuser',  function (req, res, next) {
    let data = JSON.parse(req.body.data);
    admin_data_handler.delete_user(data, function(err, results){
        res.send(results) ;
    });
}) ;

//render page get
router.get('/ui/:pagetype', function(req, res, next) {
    let app = express();
    let async = require('async') ;
    let multi_login = false ;
    async.waterfall([
        function checkAccount(callback){
            if(req.session.account_access) {
                //check if secondary account login
                let admin_data_handler = require('../utilities/admin.data.handler');
                let _fbid = req.user.facebook.id;
                let data = {fanpageid: req.session.account_access, fbid: _fbid};
                //get account info
                admin_data_handler.check_account_admin(data, function (err, _account) {
                    req.user.email = _account.email ;
                    multi_login = true ;
                    callback(null, _account.account);
                });
            }else if(req.session.super_access){
                //check if session is super access login
                let admin_data_handler = require('../utilities/admin.data.handler');
                let data = {fanpageid: req.session.super_access} ;
                multi_login = true ;
                //get account info
                admin_data_handler.get_account_permissons(data, function(err, results){
                    let _account = results ;
                    let fanpagename =_account.facebook.fanpages[0].name ;
                    //remove special chars from name
                    _account.facebook.fanpages[0].name = fanpagename.replace(/[^a-zA-Z ]/g, "");//clean up name ;
                    callback(null, _account.facebook);
                }) ;
            }else{
                //check if normal login
                if(req.user && req.user.facebook){
                    if(req.user.tips)
                        req.user.facebook.tips = req.user.tips ;
                    callback(null, req.user.facebook ) ;
                }else{
                    console.log("req.user") ;
                    // console.log(JSON.stringify(req.user, null, 4)) ;
                    res.redirect('/auth/login');
                }
            }
        },
        function loadDashboard(account, callback){
            let _uipage = "ui-pages/" + req.params.pagetype + "-ui.ejs" ;
            let _page = req.params.pagetype ;
            let _title = "Dashboard - bitbot.ai" ;

            let fbapp = require('../config/auth') ;
            let environment = app.get('env') ;

            if(req.user.email)
                account.email  =req.user.email ;


            let params = {
                facebookapp:fbapp.facebook.app_id,
                account: account,
                environment:environment,
                accountid:req.user._id,
                rendermessage:{},
                uipage:_uipage,
                pagetype:req.params.pagetype,
                title:_title,
                email:'',
                jsurl:source_url,
                aws_urls:aws_urls
            } ;
            if(req.user.email)
                params.email  =req.user.email ;

            if(account.fanpages){
                res.render('ui-template', params);
            }else{
                res.redirect('/auth/login');
                // res.send(true) ;
            }
        }
    ], function(err, results){

    }) ;

});
