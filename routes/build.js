var spawn = require("child_process").spawn;
var fs = require('fs');

function run(exe, args, callback, res){
	var p = spawn(exe, args)
	var lines = ''
	
	function parse(data) {
		lines = lines+data
	}

	p.stdout.on('data', parse);
	p.stderr.on('data', parse);

	p.on('close', function(code){
		callback(code, lines, res);
	});
}



function onCompiled (code, lines, res) {
	if (code !== 0) {
  	res.send({outputs:lines});
  	return;
  }

  function onRan(code, runlines, res) {
  	lines = lines + runlines
  	res.send({outputs:lines});
	}
  run('a.exe', [], onRan, res);
}

exports.gcc = function(req, res){
	// currently only one source file is supported.
	var single = req.body.sources[0]
	// console.log("Compiling "+single.name+'...')

	fs.writeFile(single.name, single.content, function (err) {
	  if (err) throw err;
	  run('gcc', [single.name], onCompiled, res);
	});
};
