var ResultPageView = Backbone.View.extend({

	template:  '<table>' +
					'<tr>' +
						'<td></td>' +
						'<td>{{{compilation_status}}}</td>' +
					'</tr>' +
					'<tr>' +
						'<td>Original Size:</td>' +
						'<td>{{original_size}} ({{original_size_gz}} gzipped)</td>' +
					'</tr>' +
					'<tr>' +
						'<td>Compiled Size:</td>' +
						'<td>{{compiled_size}} ({{compiled_size_gz}} gzipped)</td>' +
					'</tr>' +
					'<tr>' +
						'<td></td>' +
						'<td>Saved ... The code may also be accessed at <a href="{{compiled_js_url}}" >{{compiled_js_name}}</a>.</td>' +
					'</tr>' +					
				'</table>' +
				'<ul class="result-nav">' +
					'<li id="res-nav-compiled" class="selected">Compiled Code</li>' +
					'<li id="res-nav-warning">Warnings {{warnings_title}}</li>' +
					'<li id="res-nav-errors">Errors {{errors_title}}</li>' +
					'<li id="res-nav-post">Post data</li>' +
					'<li id="res-nav-html">Modified Html</li>' +
				'</ul>' +
				'<ul class="result-nav-content">' +
					'<li class="res-nav-compiled">' +
						'<code>{{compiled_code}}</code>' +
					'</li>' +
					'<li class="res-nav-warning {{#warnings_number}}yellow{{/warnings_number}}"">' +
						'<div>{{warnings_number}}</div>' +
						'<code>{{warnings_issues}}</code>' +
					'</li>' +
					'<li class="res-nav-errors {{#errors_number}}red_bg{{/errors_number}}">' +
						'<div>{{errors_heading}}</div>' +
						'<code>' +
						'{{#errors_issues}}' +
							'{{type}}: {{error}} at line {{lineno}} character {{charno}} {{line}} <br/>' +
						'{{/errors_issues}}' +
						'</code>' +
					'</li>' +
					'<li class="res-nav-post"></li>' +
					'<li class="res-nav-html">'+
						'<xmp>{{{modified_html}}}</xmp>'+
					'</li>' +
				'</ul>',
				
	events: {
		'click .result-nav li': 'changeTab'
	},

	changeTab: function(e) {
		var curr = $(e.currentTarget);
		
		this.$el.find('.result-nav li').removeClass('selected');
		curr.addClass('selected');
		
		this.$el.find('.result-nav-content li').hide();
		
		this.$el.find('.result-nav-content li.' + curr.attr('id')).show();
	},
	
	getModifiedHtml: function(js_url) {
		var that = this;
		var curr_url = location.hash;
		
		var iframe = $('<iframe />');
		
		$.ajax({
			url: curr_url,
			type: 'GET',
			dataType: 'html',
			context: iframe[0],
			complete: function(jqXHR, textStatus) {
			},
			error: function(jqXHR, textStatus, errorThrown) {
			},
			success: function(data, textStatus, jqXHR) {
				var pattern = /<script(\s+(\w+\s*=\s*("|').*?\3)\s*)*\s*(\/>|>.*?<\/script\s*>)/ig; //one row
				var pattern2 = /<script\s*>[^<]*<\/script>/ig;
 
				var no_scripts = data.replace(pattern, '');
				no_scripts = no_scripts.replace(pattern2, '');
				
				var pat3 = /<\/body>/ig;
				no_scripts = no_scripts.replace(pat3, '<script src="' + js_url + '"><\/script></body>');
				
				that.$el.find('.res-nav-html xmp').text(no_scripts);
			}
		});	
		
		/*
		var html = $('html').clone();

		var scripts = html.find('script');
		var type1 = scripts.filter('[src]');
		var type2 = scripts.filter(':not([src])').filter(':not([type])');
		var type3 = scripts.filter(':not([src])').filter('[type="text/javascript"]');
		
		type1.remove();
		type2.remove();
		type3.remove();

		//remove self	
		html.find('#google_closure_extention').remove();
		
		html.find('body').append('<script src="' + js_url + '"></script>');

		return html.html();*/
	},
	
	add: function(data) {
		
		var fetch_obj = {
			errors_number: ('undefined' == typeof data.errors) ? 0 : data.errors.length,
			errors_title: ('undefined' == typeof data.errors) ? '' : '(' + data.errors.length + ')',
			errors_heading: ('undefined' == typeof data.errors) ? 'No errors' :  'Number of errors ' + data.errors.length,
			errors_issues: ('undefined' == typeof data.errors) ? '' : data.errors,
			warnings_number: ('undefined' == typeof data.errors) ? 0 : data.errors.length,
			warnings_title: ('undefined' == typeof data.errors) ? '' : '( ' + data.errors.length + ')',
			warnings_heading: ('undefined' == typeof data.errors) ? 'No warnings' : 'Number of warnings ' + data.errors.length,
			warnings_issues: ('undefined' == typeof data.errors) ? '' : data.errors,
			compilation_status: '<span class="' + (('undefined' == typeof data.errors) ? 'green">Compilation was a success!' : 'red">Compilation did not complete successfully. See errors pane for details.') + '</span>',
			original_size: data.statistics.originalSize,
			original_size_gz: data.statistics.originalGzipSize,
			compiled_size: data.statistics.compressedSize,
			compiled_size_gz: data.statistics.compressedGzipSize,
			compiled_code: data.compiledCode,
			compiled_js_url: CLOSURE_URL + data.outputFilePath,
			compiled_js_name: closure_post_params.output_file_name
		}
		
		var html = Mustache.to_html(this.template, fetch_obj)
		this.$el.html(html);
		
		this.getModifiedHtml(CLOSURE_URL + data.outputFilePath);
	}


});