var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf')
var spawn = require("child_process").spawn;
var temp = require("temp");
var winston = require('winston');

temp.track();

var conf = {
	".java" : {
		compile:{
			name:'javac',
			options:function(filename){
				return ['-J-Dfile.encoding=utf8', filename];
			}
		},
		run:{
			name:'java',
			options:function(filename){
				return ['-Dfile.encoding=utf8', filename.replace(/\.java$/, '')];
			}
		}
	},
	".c" : {
		compile:{
			name:'gcc',
			options:function(filename){
				return [filename];
			}
		},
		run:{
			name:'a.exe',
			options:function(filename){
				return [];
			}
		}
	}
}

exports.index = function(req, res){
	// currently only one source file is supported.
	var single = req.body.sources[0]
	winston.info("Compiling "+single.name+'...')
	var cfg = conf[path.extname(single.name)]
	if (!cfg){
		res.send('No suitable compiler found for '+single.name);
		return;		
	}

	var lines = ''

	temp.mkdir('lbd', function(err, dirPath){
		var cwd = path.join(dirPath);
		winston.debug('Created:'+cwd)

		function execute(exe, args, callback){
			winston.debug(exe, args)
			var p = spawn(exe, args, { cwd:cwd})
		
			function parse(data){
				lines = lines+data
			}

			p.stdout.on('data', parse);
			p.stderr.on('data', parse);

			p.on('close', function(code){
				callback(code);
			});
		}

		function end(){
			// send outputs
			res.send({outputs:lines});
			// cleaup temp dir.
			rimraf(cwd, function(){winston.debug('Removed:'+cwd)});
		}


		function postCompile (code){
			if (code !== 0)
				return end();

			winston.debug('Running '+cfg.run.name)
			execute(cfg.run.name, cfg.run.options(single.name), end);
		}

		fs.writeFile(path.join(cwd, single.name), single.content, function (err){
			if (err) throw err;
			winston.debug('Compile ' + single.name)
			execute(cfg.compile.name, cfg.compile.options(single.name), postCompile);
		});
	});
};

