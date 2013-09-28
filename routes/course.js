var fs = require('fs')
var courses = JSON.parse(fs.readFileSync('db/courses/all.json'))

exports.index = function(req, res){
  res.render('courses', { path: '/courses', all:courses.all });
};