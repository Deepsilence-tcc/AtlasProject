var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');

var index = require('./routes/index');
var users = require('./routes/users');
var Home = require('./controller/fetch.data.controller.js');
var HomeRouter = require('./routes/home.data.route');
var db = require('./utils/db');
db.init();
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var HomeController = require('./controller/fetch.data.controller');

app.use('/pic',HomeController.getPic);
app.use('/data',HomeRouter);
// Home.fetchData();
// Home.fetchDetail();

var rule = new schedule.RecurrenceRule();
// rule.minute = [0,5,10,15,20,25,30,35,40,45,50,55,60];
rule.second = [0,60];

function scheduleCronstyle(){
    schedule.scheduleJob('40 41 0 * * *', function(){
        Home.fetchData();
    });
}
function scheduleDetailstyle(){
    schedule.scheduleJob('40 29 0 * * *', function(){
        Home.fetchDetail();
    });
}
scheduleCronstyle();
scheduleDetailstyle();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
