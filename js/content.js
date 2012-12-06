var TITLE = 'Closure Compiler';
var CLOSURE_URL = 'http://closure-compiler.appspot.com';

console.log(TITLE + ' Loaded');

var SETTINGS = {
	minify_html: true,
	show_full_url: false,
	popup_dimensions: {
		width: 720,
		height: 800
	}
}	

var get_scripts = [];
var streams_holder = [];
var parallel = 1
var status = 0;
var location_href_regexp = new RegExp(location.href);
var start_time = 0;
var randoms = [312, 12, 32, 65, 76];
var randomizer = Math.floor((Math.random() * (randoms.length - 1) ));

var container = $('<div />', {
	id: 'google_closure_extention' 
});

var loading_elem = $('<div />', {
	'class': 'loading'
});


var closure_post_params = {
	js_code: '',
	compilation_level: 'WHITESPACE_ONLY',
	output_format: 'json',
	output_info: 'compiled_code',
	warning_level:'DEFAULT',
	output_file_name: _.uniqueId('compiled_') + Math.floor( ( Math.random()*randomizer ) + 1 )  + '.js'
};

var closure_get_params = ['statistics', 'errors', 'warnings'];

var closure_get_string = '?output_info=' + closure_get_params.join('&output_info=');


var ScriptModel = Backbone.Model.extend({
	initialize: function() {
		var end_time = new Date().getTime();
		var loading_time = (end_time - start_time) / 1000;
		
		this.set({
			order: this.collection.getNextOrder(),
			load_time: loading_time,
			selected: false
		});
	},
	getOrderFormatted: function() {
		return this.get('order').padding(String(this.collection.length).length);
	},
	toggle: function() {
		this.set({
			selected: !this.get('selected')
		});
	}
});

var ScriptsCollection = Backbone.Collection.extend({
	model: ScriptModel,
	
	getNextOrder: function() {
		return (!this.length) ? 1 : this.last().get('order') + 1;
	},
	
	selectUnselect: function() {
		var selected = this.filter(function(model) {
			return model.get('selected');
		});

		if (selected.length < this.length) {
			var unselected = this.without.apply(this, selected);
			$.each(unselected, function() {
				this.trigger('selected');
			});
		} else	
			this.each(function(model) {
				model.trigger('selected');
			});
	},
	
	getSelected: function() {
		return this.filter(function(model) {
			return model.get('selected');
		});
	}
});

var ScriptView = Backbone.View.extend({
	tagName: 'li',
	
	template:   '<span>{{order_formatted}}</span>'+
				'<input id="{{id}}" type="checkbox" />'+
				'<label for="{{id}}">{{src}}</label>',
	
	events: {
		'change input': 'select'
	},
	
	initialize: function() {
		this.model.on('selected', this.clickCheckbox, this);
	},
	
	clickCheckbox: function() {
		this.$el.find('input').click();
	},
	
	select: function(e) {
		this.model.toggle();
		
		this.$el.toggleClass('selected', this.model.get('selected'));
	},
	
	render: function() {
	
		var fetch_obj = {
			order_formatted: this.model.getOrderFormatted()
		}
	
		var html = Mustache.to_html(this.template, $.extend(fetch_obj, this.model.toJSON()));
	
		this.$el.html(html);
	
		return this;
	}
});

var Scripts = new ScriptsCollection;

var ContentView = Backbone.View.extend({
	
	template:   '<section class="page main">'+
					'<div class="list_control">'+
						'<a class="mark" href="#">All</a>'+
					'</div>'+
					'<ul class="scripts-list"></ul>'+	
					'<div class="stats"></div>'+
				'</section>'+
				'<section class="page options">'+
		
				'</section>'+
				'<section class="page result">'+

				'</section>',
			
	stats_template: 'Time: <span>{{loading_time}}sec</span>, Total: <span>{{scripts_total}}</span>, Selected: <span>{{selected}}</span>',
	
	events: {
		'click .mark': 'selectUnselect',
		'change .options input': 'setOptions'
	},

	initialize: function() {
		Scripts.on('load', this.showAll, this);
		Scripts.on('change:selected', this.changeStats, this);
		
		this.$el.html(this.template);
		
		
		
		
		/* draw options  */
		$.each(options_data.Options, function() {
			$.each(this.list, function() {
				if (this.value == closure_post_params[this.name]) {
					this.checked = true;
					return false;
				}
			});
		});
		this.$el.find('.page.options').append(Mustache.to_html(options_template, options_data));
	},

	setOptions: function(e) {
		var that = this;
		var temp = {};
		this.$el.find('.options input').each(function() {
			var elem = $(this);
			var key = elem.attr('name');
			var value = elem.val();
			
			var display_func = 'hide';
			
			if (elem.is(':checked')) {
				temp[key] = value;
				display_func = 'show';
			} else 
				delete temp[key];
			
			that.$el.find('.' + value)[display_func]();
		}); 
		
		
		
		$.extend(closure_post_params, temp);
	},	
	
	selectUnselect: function(e) {
		e.preventDefault();
		Scripts.selectUnselect();
	},
	
	changeStats: function() {
		this.$el.find('.stats span:last').html(Scripts.getSelected().length);
	},
	
	addResult: function(data) {
		var result_page =  new  ResultPageView({
			el: this.$el.find('.result')
		});
		
		result_page.add(data);		
	},
	
	showPage: function(page) {
		if (!page)
			return this.$el.find('.page:visible');
		
		this.$el.find('.page').hide().filter('.' + page).show();
	},
	
	addOne: function(model) {
		var view = new ScriptView({model: model});
		this.$el.find('section ul').append(view.render().el);
	},
	
	showAll: function() {
		//Scripts.each(this.addOne);
		var loading_time = 0;
		var that = this;
		$.each(Scripts.models, function() {
			that.addOne(this);
			loading_time += this.get('load_time');
		});
		
		var html = Mustache.to_html(this.stats_template, {
			loading_time: loading_time.toFixed(2),
			scripts_total: Scripts.models.length,
			selected: 0
		});
		this.$el.find('.stats').html(html);
		
		this.$el.append(loading_elem);
	}	
});


var runRequest = function(script) {
	return $.ajax({
		url: script.src_full,
		dataType: 'text',
		success: function(content) {
			var script_obj = {
				id: script.id,
				src: script.src_full.replace(location_href_regexp, ''),
				checked: false,
				text: content
			};	
			
			Scripts.get(script.id).set(script_obj);
		}
	});
}


start_time = new Date().getTime();
$('script').each(function() {
	var src = $(this).attr('src');
	var type = $(this).attr('type')
	
	var condition1 = (src && src.match(/\.js/));
	var condition2 = (!type || type.match(/text\/javascript/));
	
	if (condition1 || condition2) {
		var id = _.uniqueId('index_');

		if (condition1) {
			
			var script_obj = {
				id: id,
				src_full: src
			};		
			
			get_scripts.push(script_obj);
			
		} else  {
			var text = $(this).html();
			
			var script_obj = {
				id: id,
				src: text.replace(/(\s*)|(\n\r)|(\n)|(\r)/, '').substring(0, 15),
				checked: false,
				text: text
			};	
		}

		Scripts.add(script_obj);
	}
});


var collectSources = function() {
	start_time = new Date().getTime();
	
	status = 1;
	
	$.each(get_scripts, function(i, script) {
		var index = i % parallel;
		var stream = streams_holder[index];
		if (!stream) {
			stream = $.Deferred();
			stream.resolve();
			streams_holder.push(stream);
		}
		
		stream = stream.pipe( function() {
			//console.log("Parallel " + (index + 1) + ". Making request for [" + script.src_full + "]");
			return runRequest(script);
		});		
	});
	
	$.when.apply(this, streams_holder).done(function() {
		var end_time = new Date().getTime();
		var loading_time = (end_time - start_time) / 1000;
		console.log('done in ' + loading_time + ' sec');
		
//		_.defer(function() {
//		});
		
		status = 2;
		
		
	});
}

$(document).ready(function() {
	collectSources();
});


var sendMessage = function(msg_obj) {
	chrome.extension.sendMessage(msg_obj, function(response) {
	  console.log(response);
	});
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.background && request.openPopup)	{
		openPopup();
	}

});

var openPopup = function() {

	$('body').append(container);
	
	var masterView = new ContentView({
		el: container
	});
	
	Scripts.trigger('load');
	
	container.dialog({
		minWidth: 720,
		maxHeight: 800,
		title: '<a href="' + CLOSURE_URL + '" target="_blank">' + TITLE + '</a>',
		modal: true,
		buttons: {
			'Compile': function(e) {
				var scripts_text = '';
				var selected = Scripts.getSelected();
				$.each(selected, function() {
					scripts_text += '\n' + this.get('text');
				});
				
				var params = $.extend({}, closure_post_params, {js_code: scripts_text});
				
				loading_elem.show();
				
				$.ajax({
					url: CLOSURE_URL+ '/compile' + closure_get_string,
					type: 'POST',
					data: params,
					dataType: 'json',
					complete: function(jqXHR, textStatus) {
					},
					error: function(jqXHR, textStatus, errorThrown) {
					},
					success: function(data, textStatus, jqXHR) {
						try {
							masterView.addResult(data);
							masterView.showPage('result');	
							loading_elem.hide();		
						} catch(e) {}

					}
				});			
			},
			'Options': function(e) {
				var page = 'options';
				
				$(e.currentTarget).find('span').text(page);
				
				if (masterView.showPage().is('.' + page)) 
					page = 'main';
				else
					$(e.currentTarget).find('span').text('main');
				
				masterView.showPage(page);
				
			}
		}
	});

	
}

