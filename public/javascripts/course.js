window.Course = (function(){
	var mimelookup = {
		".c":"text/x-csrc",
		".h":"text/x-csrc",
		".cpp":"text/x-c++src",
		".hpp":"text/x-c++src",
		".css":"text/css",
		".java":"text/x-java",
		".js":"text/javascript",
		".json":"application/x-json",
		".html":"text/html",
		".md":"text/x-markdown",
		".lua":"text/x-lua"
	}
	var editors = []
	var sources = []

	function getMode(filename)
	{
		var ext = /\.[^.\\/]+$/.exec(filename);
		var mime = null
		if (!ext)
			return null

		mime = mimelookup[ext]

		if (!mime)
			return null

		for (var i = 0; i < CodeMirror.modeInfo.length; i++)
		{
			if (CodeMirror.modeInfo[i].mime == mime)
				return CodeMirror.modeInfo[i];
		}
		return null
	}

	function setupPlaceholders(e) {
		var pattern = /\/\*\/\/[^*]*?\/\/\*\//;
		var editor = e;

		if (editor.getOption("readOnly"))
			return;

		
		function createPlaceholderElement(e) {
				var span = document.createElement("span");
				span.appendChild(document.createTextNode("(" + e.replace("/*//", "").replace("//*/", "") + ")"))
				span.className = "CodeMirror-autoplace"
				return span
		}

		function createPlaceholder(e, cursor) {
				if (e.findMarksAt(cursor.from()).length)
					return;

				var span = createPlaceholderElement(e.getRange(cursor.from(), cursor.to()))
				var tm = e.markText(cursor.from(), cursor.to(), {replacedWith: span, clearOnEnter: true, lastRange:{}})

				CodeMirror.on(span, "mousedown", function (e) {
					e.preventDefault()
					return tm.clear()
				})

				function unhide() {
					var r = e.getRange(tm.lastRange.from, tm.lastRange.to)
					if (r.match(pattern) === null) {
						e.replaceRange("", tm.lastRange.from, {line: tm.lastRange.to.line, ch: tm.lastRange.to.ch - 1})
					}
					else {
						e.replaceRange("", tm.lastRange.from, tm.lastRange.to)
					}
					e.focus();
					e.setCursor(tm.lastRange.from);
				}
				CodeMirror.on(tm, "unhide", unhide)
				CodeMirror.on(tm, "clear", function(from, to){
					tm.lastRange.from = from;
					tm.lastRange.to = to;
					unhide();
				})
		}
		var cursor = editor.getSearchCursor(pattern)
		while (cursor.findNext())
			createPlaceholder(editor, cursor);

		editor.on("change", function (editor) {
				var n = [];
				var cursor = editor.getSearchCursor(pattern);
				while (cursor.findNext())
					n.push(createPlaceholder(editor, cursor));
				return n;
		})
	}


	function setupExercise(exercise) {
		sources = []
		editors = [] // empty old editors

		// 
		$('#instructions')
			.empty()
			.append('<h1>'+exercise.title+'</h1>')
			.append(exercise.instructions)

		// editors
		var current = 0 // current editor index
		var files = exercise.files
		for (var i=0;i <files.length; i++){
			var file = files[i]
			var id = "editor-buffer-"+i
			sources.push({name:file.name})
			$('#editor-tabs')
				.empty()
				.append("<li><a data-target=\"#"+id+"\">"+file.name+"</a></li>")
			$('#editor-buffers')
				.empty()
				.append("<div id=\""+id+"\" class=\"tab-pane fade\"><textarea class=\"editor\">"+file.initial_value+"</textarea></div>")
		}

		$('#editor-tabs :first-child').addClass('active')
		$('#editor-buffers :first-child').addClass('active in')
		$(".nav-tabs a").click(function(e){
			$(this).tab('show');
			current = $(this).attr('data-target').match(/\d+/);
		})
		CodeMirror.modeURL = "/javascripts/codemirror/mode/%N/%N.js";
		$(".editor").each(function(index){
			var editor = CodeMirror.fromTextArea(this, {lineNumbers:true, theme:"solarized dark"});

			var mi = getMode(files[index].name);
			if (mi){
				CodeMirror.autoLoadMode(editor, mi.mode);
				editor.setOption('mode', mi.mime);
			}
			setupPlaceholders(editor);
			editors.push(editor);
		});

	}

	function setupButtons(exercises){
			var posted = false;
			var widgets = []
			$('#commit').click(function(){
				if (posted)
					return;

				// check if all widget have been filled.
				$(".CodeMirror-widget").each(function(index){
					$(this)
						.addClass('hilight', 100)
						.removeClass('hilight', 100)
						.addClass('hilight', 100)
						.removeClass('hilight', 100)
						.addClass('hilight', 100)
						.removeClass('hilight', 100)
							;
				})
				
				if ($(".CodeMirror-widget").length > 0)
					return;

				posted = true;

				for (var i = 0; i < editors.length; i++)
					sources[i].content = editors[i].getDoc().getValue()

				// clean old build errors
				for (var i = 0; i < widgets.length; ++i)
					editors[0].removeLineWidget(widgets[i]);
				widgets.length = 0;
				$.post('/build', {sources:sources}, function(res){
					var lastLine = -1
					for (var file in res.reports) {
						var issues = res.reports[file]
						for (var i = 0; i < issues.length; i++){
							var issue = issues[i];
							if (issue.line == lastLine)
								continue; // only first for this line is marked.
							var div = document.createElement('div');
							var span = div.appendChild(document.createElement('span'))
							var anchor = editors[0].getLine(issue.line-1).substr(0, issue.ch-1).replace(/\S/g, ' ') + '^ '
							span.appendChild(document.createTextNode(anchor));
							div.appendChild(document.createTextNode(issue.message));
							span.className = "keepwhitespaces";
							div.className = issue.type
							widgets.push(editors[0].addLineWidget(issue.line - 1, div, {coverGutter: false}));
							lastLine = issue.line
						}
					}

					var terminal = $('#terminal')
					function appendConsole() {
						var lines = res.outputs.split(/\r\n|\r|\n/).length
						terminal.append('<pre class="active black" data-lines="'+lines+'">'+res.outputs+'</pre>');
						var s = terminal.prop("scrollHeight") - terminal.height()
						terminal.animate({ scrollTop: s}, 300, function(){
							terminal.children('pre:last-child').removeClass('black', 100);
							posted = false;
							if (lastLine == -1) // still -1, means no errors...
							{
								var dialog = ((exercises.current + 1) == exercises.length) ? $('#dialog-alldone') : $('#dialog-done')
								dialog.modal()
							}
						});
					}
					var last = terminal.children('pre:last-child')
					if (last.length > 0)
						last.removeClass('active', last.data('lines')*100, appendConsole);
					else
						appendConsole();
				});
			});

			function next(){
				$('#links-next').prop("disabled", true);
				var n = exercises.current + 1
				if (n == exercises.length)
					return
				exercises.current = n
				setupExercise(exercises[n])
			}

			$('#links-next').click(next)
			$('#dialog-done-next').click(next)
			$('#dialog-done-stay').click(function(){
				$('#links-next').prop("disabled", false);
			})
		}


	return function(exercises)
	{
		exercises.current = exercises.current || 0
		setupButtons(exercises);
		setupExercise(exercises[exercises.current])
	}
})();
