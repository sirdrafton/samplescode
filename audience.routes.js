var express = require('express');
var router = express.Router();
var debug = require('debug')('routeAudience:server');
var _ = require("underscore");
var admin_data_handler 	= require('../utilities/admin.data.handler');

router.post('/getfanpageusers', function(req, res, next) {
    //return data as json
    var data  = (req.body.data) ? req.body.data : req.body;
    data = _.isObject(data) ? data : JSON.parse(data);
    admin_data_handler.get_fanpage_users(data, function(err, results){
        res.send(results) ;
    });
}) ;

router.post('/getalluseractivity', function(req, res, next) {
    var data  = (req.body.data) ? req.body.data : req.body;
    data = _.isObject(data) ? data : JSON.parse(data);
    admin_data_handler.get_user_activity(data, function(err, results){
        res.send(results) ;
    }) ;
}) ;

router.post('/removeuser',  function (req, res, next) {
    var data = JSON.parse(req.body.data);
    admin_data_handler.delete_user(data, function(err, results){
        res.send(results) ;
    });
}) ;
