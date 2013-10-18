var fs = require('fs')
var path = require('path')
var courses = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/courses/all.json')))

exports.index = function(req, res){
  res.render('courses', { path: '/courses', all:courses.all });
};