var fs = require('fs')
var index = require('./index')
var lessons = JSON.parse(fs.readFileSync('db/lessons/all.json'))


/*
 * GET lessons listing.
 */

exports.index = function(req, res){
  var id = req.params.course
  console.log("handling lessons for course "+id)

  function render(){
  	res.render('lessons', { path:'/lessons', course:id, lesson:lesson });
  }

  var lesson = lessons.all[1]
  if (!lesson.data) {
  	fs.readFile('db/lessons/'+lesson.file, function(err, data){
  		console.log("Lading lesson file: " + lesson.file);
	  	if (err) throw err;
	  	lesson.data = data
	  	render();
	  }); 
  }
  else
  {
  	console.log("Lesson file cached: " + lesson.file);
	render();
  }
};

