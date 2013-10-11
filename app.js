
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var college = require('./routes/college');
var branch = require('./routes/branch');
var course = require('./routes/course');
var lesson = require('./routes/lesson');
var build = require('./routes/build')
var http = require('http');
var path = require('path');
var fs = require('fs')
var winston = require('winston');

var app = express();

// log
var logs = path.join(__dirname, 'logs')
if (!fs.existsSync(logs))
	fs.mkdirSync(logs)
var accesslog = path.join(logs, 'access.log')

var winstonStream = {
    write: function(message, encoding){
        winston.info(message.replace(/[\n]$/, ''));
    }
};


winston
  .remove(winston.transports.Console)
  .add(winston.transports.Console, {colorize:true, silent:false, level:"warn"}) // Levels: silly/debug/verbose/info/warn/error
  .add(winston.transports.File, {colorize:false, level:"info", json:false, filename:accesslog, timestamp:true})

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.logger({stream:winstonStream, format: 'short'}));

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


app.get('/', routes.index);
app.get('/colleges', college.index);
app.get('/branches', branch.index);
app.get('/courses', course.index);
app.get('/lessons', lesson.index);
app.get('/about', routes.about);
app.post('/build', build.index);

http.createServer(app).listen(app.get('port'), function(){
  winston.info('Express server started, listening on port ' + app.get('port'));
});

