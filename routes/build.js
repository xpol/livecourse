var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf')
var spawn = require("child_process").spawn;
var temp = require("temp");
var winston = require('winston');

temp.track();

function javac_scan(messages){
	var o = {}

	for (var i = 0; i < messages.length; i++)
	{
		var r = messages[i].match(/^([^:]+):(\d+): ([^:\s]+): (.+)$/)
		if (r != null)
		{
			i += 2
			var file = r[1]
			o[file] = o[file] || []
			var ch = messages[i].length - 1
			var err = {line:r[2], ch:ch, type:r[3], message:r[4]}
			//if (/^\s+\^$/.test(messages[i]))
				
			o[file].push(err)
		}
	}
	return o
}

function gcc_scan(messages){
	var o = {}
	for (var i = 0; i < messages.length; i++)
	{
		var r = messages[i].match(/^([^:]+):(\d+):(\d+): ([^:]+): (.+)$/)
		if (!r) continue;
		if (r[4] === 'note') continue;
		i += 2;
		var file = r[1];
		o[file] = o[file] || [];
		o[file].push({line:r[2], ch:r[3], type:r[4], message:r[5]});
	}
	return o
}

var conf = {
	".java" : {
		compile:{
			name:'javac',
			options:function(filename){
				return ['-J-Dfile.encoding=utf8', filename];
			},
			scan:javac_scan
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
			},
			scan:gcc_scan
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
	var reports = {}

	temp.mkdir('lbd', function(err, dirPath){
		var cwd = path.join(dirPath);
		winston.debug('Created:'+cwd)

		function execute(exe, args, callback){
			var cmd = exe + " " + args.join(" ")
			winston.debug(cmd)
			lines = lines + "\n>" + cmd + "\n"
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
			res.send({outputs:lines, reports:reports});
			// cleaup temp dir.
			rimraf(cwd, function(){winston.debug('Removed:'+cwd)});
		}


		function postCompile (code){
			reports = cfg.compile.scan(lines.split(/\r\n|\n|\r/))
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

