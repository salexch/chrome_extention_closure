var ResultPageView = Backbone.View.extend({

	template:  '<table>' +
					'<tr>' +
						'<td></td>' +
						'<td>{{{compilation_status}}}</td>' +
					'</tr>' +
					'<tr>' +
						'<td>Original Size:</td>' +
						'<td>{{#original_size}}{{original_size}} ({{original_size_gz}} gzipped){{/original_size}}</td>' +
					'</tr>' +
					'<tr>' +
						'<td>Compiled Size:</td>' +
						'<td>{{#original_size}}{{compiled_size}} ({{compiled_size_gz}} gzipped){{/original_size}}</td>' +
					'</tr>' +
					'<tr>' +
						'<td></td>' +
						'<td>{{#compiled_js_url}}Saved ... The code may also be accessed at <a href="{{compiled_js_url}}" >{{compiled_js_name}}</a>.{{/compiled_js_url}}</td>' +
					'</tr>' +					
				'</table>' +
				'<ul class="result-nav">' +
					'<li id="res-nav-compiled" class="selected">Compiled Code</li>' +
					'<li id="res-nav-warning">Warnings {{warnings_title}}</li>' +
					'<li id="res-nav-errors">Errors {{errors_title}}</li>' +
					'<li id="res-nav-post">Post data</li>' +
					'<li id="res-nav-css">Minified Css</li>' +
					'<li id="res-nav-html">Modified Html</li>' +
				'</ul>' +
				'<ul class="result-nav-content">' +
					'<li class="res-nav-compiled">' +
						'<code>{{compiled_code}}</code>' +
					'</li>' +
					'<li class="res-nav-warning {{#warnings_number}}yellow{{/warnings_number}}"">' +
						'<div>{{warnings_heading}}</div>' +
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
					'<li class="res-nav-css">'+
						'<xmp>{{{modified_css}}}</xmp>'+
					'</li>' +
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
	
	getModifiedHtml: function() {
		var that = this;
		var curr_url = location.hash;
		
		$.ajax({
			url: curr_url,
			type: 'GET',
			dataType: 'html',
			complete: function(jqXHR, textStatus) {
			},
			error: function(jqXHR, textStatus, errorThrown) {
			},
			success: function(data, textStatus, jqXHR) {
				var selected_js = Scripts.getSelected();
				
				//var replace = [/(\$)/ig, /(\{)/ig, /(\})/ig, /(\()/ig, /(\))/ig, /(\s+)/ig, /(\r)/ig, /(\n)/ig, /(\t)/ig]; //text = text.replace(replace[i], '\\$1');
				
				var replace = [/\$/ig, /\{/ig, /\}/ig, /\(/ig, /\)/ig, /\s+/ig, /\r/ig, /\n/ig, /\t/ig];
				var replacer = ['\\$', '\\{',  '\\}',  '\\(',  '\\)',  '\\s+',  '\\r',  '\\n',  '\\t'];
				
				$.each(selected_js, function() {
					if (this.get('src_full')) 
						var regexp = '<script.*' + this.get('src') + '[^<]*<\/script>';
					else {
						var text = this.get('text');
						
						for(var i = 0;i < replace.length ;i++) 
							text = text.replace(replace[i], replacer[i]);
							
						regexp = '<script>' + text + '[^<]*<\/script>';
					}
					var pattern =  new RegExp(regexp, 'ig');
					data = data.replace(pattern, '');
				});				
				

				var selected_css = Styles.getSelected();
				//var replace = [/\$/ig, /\s+/ig, /\r/ig, /\n/ig, /\t/ig]
				//var replacer = ['\\$', '\\s+', '\\r', '\\n', '\\t'];
				
				$.each(selected_css, function() {
					if (this.get('src_full')) 
						var regexp = '<link.*' + this.get('src') + '[^<]*>';
					else {
						var text = this.get('text');
						
						for(var i = 0;i < replace.length ;i++) 
							text = text.replace(replace[i], replacer[i]);
							
						regexp = '<style>' + text + '[^<]*<\/style>';
					}
					var pattern =  new RegExp(regexp, 'ig');
					data = data.replace(pattern, '');
				});					
				
				
				var pat3 = /<\/body>/ig;
				
				if (selected_js.length) {
					if (!SETTINGS.js_inject_inline) {
						var js_url = CLOSURE_URL + that.data.outputFilePath;
						data = data.replace(pat3, '<script src="' + js_url + '"><\/script>\n</body>');
					} else 
						data = data.replace(pat3, '<script>' + that.data.compiledCode + '<\/script>\n</body>');
				}

				if (selected_css.length) {
					if (SETTINGS.css_inject_inline) {
						data = data.replace(pat3, '<style>' + that.data.css + '<\/style>\n</body>');
					} 
				}


				
				if (SETTINGS.minify_html)
					data = data.replace(/(\n|\r|\t)/ig, '');
				
				that.$el.find('.res-nav-html xmp').text(data);
			}
		});	

	},
	
	add: function(data) {
		this.data = data;
		
		var error_status = ('undefined' == typeof data.errors);
		var warning_status = ('undefined' == typeof data.errors);
		
		var fetch_obj = {
			errors_number: (error_status) ? 0 : data.errors.length,
			errors_title: (error_status) ? '' : '(' + data.errors.length + ')',
			errors_heading: (error_status) ? 'No errors' :  'Number of errors ' + data.errors.length,
			errors_issues: (error_status) ? '' : data.errors,
			warnings_number: (warning_status) ? 0 : data.errors.length,
			warnings_title: (warning_status) ? '' : '( ' + data.errors.length + ')',
			warnings_heading: (warning_status) ? 'No warnings' : 'Number of warnings ' + data.errors.length,
			warnings_issues: (warning_status) ? '' : data.errors,
			compilation_status: '<span class="' + ((error_status) ? 'green">Compilation was a success!' : 'red">Compilation did not complete successfully. See errors pane for details.') + '</span>',
			original_size: ('undefined' == typeof data.statistics) ? false : data.statistics.originalSize,
			original_size_gz: ('undefined' == typeof data.statistics) ? '' : data.statistics.originalGzipSize,
			compiled_size: ('undefined' == typeof data.statistics) ? '' : data.statistics.compressedSize,
			compiled_size_gz: ('undefined' == typeof data.statistics) ? '' : data.statistics.compressedGzipSize,
			compiled_code: ('undefined' == typeof data.compiledCode) ? '' : data.compiledCode,
			compiled_js_url: ('undefined' == typeof data.outputFilePath) ? false : CLOSURE_URL + data.outputFilePath,
			compiled_js_name: ('undefined' == typeof data.statistics) ? '' : closure_post_params.output_file_name,
			
			modified_css: ('undefined' == typeof data.css) ? '' : data.css
		}
		
		var html = Mustache.to_html(this.template, fetch_obj)
		this.$el.html(html);
		
		this.getModifiedHtml();
	}


});