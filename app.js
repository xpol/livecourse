
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
var log4js = require('log4js');

var app = express();

/*
fs.stat('logs').mode
fs.mkdirSync('logs')
*/
log4js.configure({
	replaceConsole: true,
  appenders: [
    { type: 'console' },
    {
      type: 'file',
      filename: 'logs/access.log', 
      maxLogSize: 1024,
      backups:3,
      category: 'normal' 
    }
  ]
});

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(log4js.connectLogger(log4js.getLogger('normal'), {level:log4js.levels.INFO, format:':method :url'}));
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
  console.log('Express server listening on port ' + app.get('port'));
});

