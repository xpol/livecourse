var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf')
var spawn = require("child_process").spawn;
var tmp = require("tmp");
var winston = require('winston');

tmp.setGracefulCleanup();

var errors_zhCN = {
	'错误':'error',
	'警告':'warning',
}
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
			r[3] = errors_zhCN[r[3]] || r[3]
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
			cmd:'javac',
			options:function(filename){
				return [filename];
			},
			hiddenOptions:['-J-Dfile.encoding=utf8'],
			scan:javac_scan
		},
		run:{
			cmd:'java',
			options:function(filename){
				return [filename.replace(/\.java$/, '')];
			},
			hiddenOptions:['-Dfile.encoding=utf8'],
		}
	},
	".c" : {
		compile:{
			cmd:'gcc',
			options:function(filename){
				return [filename];
			},
			scan:gcc_scan
		},
		run:{
			cmd:(process.platform === "win32") ? 'a.exe' : './a.out',
			options:function(filename){
				return [];
			}
		}
	}
}

exports.index = function(req, res){
	// currently only one source file is supported.
	var single = req.body.sources[0]
	winston.debug("Compiling %s...", single.name)
	var cfg = conf[path.extname(single.name)]
	if (!cfg){
		var e = 'No suitable compiler found for '+single.name
		winston.debug(e)
		res.send(e);
		return;		
	}

	var lines = ''
	var reports = {}

	tmp.dir(function(err, dirPath){
	  if (err) throw err;

		var cwd = path.join(dirPath);
		winston.debug('Created:'+cwd)
		function cleanup(){
			rimraf(cwd, function(){winston.debug('Removed:'+cwd)});
		}

		function execute(action, filename, callback){
			var args = action.options(filename)
			var cmd = action.cmd + " " + args.join(" ")
			winston.debug(cmd)
			//lines = lines + "\n>" + cmd + "\n"
			if (action.hiddenOptions)
				args = action.hiddenOptions.concat(args)
			var p = spawn(action.cmd, args, { cwd:cwd})

			function collect(data){
				lines = lines+data
			}

			p.stdout.on('data', collect);
			p.stderr.on('data', collect);

			p.on('error', function(e){
				switch(e.code){
					case 'ENOENT':
						winston.error('Command Not Found: '+ action.cmd);
						break;
					default:
						winston.error('Unexpected spawn error:' + e);
				}
				res.send(500);
				cleanup();
			})
			p.on('close', function(code){
				callback(code);
			});
		}

		function end(){
			res.send({outputs:lines, reports:reports});
			cleanup();
		}


		function postCompile (code){
			reports = cfg.compile.scan(lines.split(/\r\n|\n|\r/))
			lines = ''
			if (code !== 0)
				return end();

			winston.debug('Running '+cfg.run.name)
			execute(cfg.run, single.name, end);
		}

		fs.writeFile(path.join(cwd, single.name), single.content, function (err){
			if (err) throw err;
			winston.debug('Compile ' + single.name)
			execute(cfg.compile, single.name, postCompile);
		});
	});
};

