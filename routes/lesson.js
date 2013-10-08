var fs = require('fs')
var index = require('./index')


/*
 * GET lessons listing.
 */

exports.index = function(req, res){
  var id = req.param("course")
  var filename = 'db/lessons/'+id+'.json'

  fs.readFile(filename, function(err, data){
  	if (err)
  	{
  		res.status(404).send('Course Not Found!');
  		return;
  	}
  	try{
		  	var exercises = JSON.parse(data).exercises
  	}
  	catch (e){
  		res.status(500).send("Internal error" + e);
  		return;
  	}
  	res.render('lessons', { path:'/lessons', exedb:JSON.stringify(exercises) });
  })
  
};

