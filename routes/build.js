var spawn = require("child_process").spawn;
var fs = require('fs');
var path = require('path');

var conf = {
	".java" : {
		compiler:{
			name:'javac',
			options:function(filename) {
				return ['-J-Dfile.encoding=utf8', filename];
			}
		},
		runner:{
			name:'java',
			options:function(filename) {
				return ['-Dfile.encoding=utf8', filename.replace(/\.java$/, '')];
			}
		}
	},
	".c" : {
		compiler:{
			name:'gcc',
			options:function(filename) {
				return [filename];
			}
		},
		runner:{
			name:'a.exe',
			options:function(filename) {
				return [];
			}
		}
	}
}

exports.index = function(req, res){
	// currently only one source file is supported.
	var single = req.body.sources[0]
	// console.log("Compiling "+single.name+'...')
	var cfg = conf[path.extname(single.name)]
	if (!cfg){
		res.send('No suitable compiler found for '+single.name);
		return;		
	}

	function run(exe, args, callback){
		console.log(exe, args)
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



	function postCompile (code, lines) {
		if (code !== 0) {
			res.send({outputs:lines});
			return;
		}

		function postRun(code, runlines) {
			lines = lines + runlines
			res.send({outputs:lines});
		}
		console.log('Running '+cfg.runner.name)
		run(cfg.runner.name, cfg.runner.options(single.name), postRun);
	}

	fs.writeFile(single.name, single.content, function (err) {
		if (err) throw err;
		console.log('Compile ' + single.name)
		run(cfg.compiler.name, cfg.compiler.options(single.name), postCompile);
	});
};

