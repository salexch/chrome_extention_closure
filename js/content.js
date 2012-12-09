var TITLE = 'Closure Compiler';
var CLOSURE_URL = 'http://closure-compiler.appspot.com';

console.log(TITLE + ' Loaded');

var SETTINGS = {
	minify_html: false,
	compiled_css_inject_inline: false,
	compiled_js_inject_inline: false,
	show_full_url: false,
	popup_dimensions: {
		width: 720,
		height: 800
	}
}	


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







var ContentView = Backbone.View.extend({
	
	template:   '<section class="page main">'+
					'<ul class="main-nav-menu">'+
						'<li id="js_content" class="selected" >Js</li>'+
						'<li id="css_content" >Css</li>'+
					'</ul>'+
					'<ul class="main-nav-content">'+
						'<li class="js_content">'+

						'</li>'+
						'<li class="css_content">'+
							'<div class="list_control">'+
								'<a class="mark" href="#">All</a>'+
							'</div>'+
							'<ul class="scripts-list"></ul>'+	
							'<div class="stats"></div>'+
						'</li>'+
					'</ul>'+
				'</section>'+
				'<section class="page options">'+
		
				'</section>'+
				'<section class="page result">'+

				'</section>',
			
	events: {
		'click .main-nav-menu li': 'changeTab',
		'change .options input': 'setOptions'
	},

	initialize: function() {
		this.$el.html(this.template);

		var script_tab = new ScriptsTabView({
			el: this.$el.find('.js_content'),
			collection: Scripts
		});
		
		Scripts.trigger('load');


		
		var styles_tab = new ScriptsTabView({
			el: this.$el.find('.css_content'),
			collection: Styles
		});
		
		Styles.trigger('load');

		
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
		
		this.$el.append(loading_elem);
	},

	changeTab: function(e) {
		this.$el.find('.main-nav-menu li').removeClass('selected');
		var class_name = $(e.currentTarget).addClass('selected').attr('id');
		
		this.$el.find('.main-nav-content>li').hide();
		this.$el.find('.main-nav-content li.' + class_name).show();
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
	}
	
});


$(document).ready(function() {
	Scripts.getCurrDocScripts();
	Styles.getCurrDocScripts();
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


var getCompile = function() {
	loading_elem.show();
	
	$.when(Styles.compile(), Scripts.compile()).then(function(css, js) {
		var data = {};
		if (js && !css)
			data = js;
			
		if (css && !js) 
			data.css = css;
			
		if (css && js)	{
			data = js;
			data.css = css;
		}	
	
		openPopup.masterView.addResult(data);
		openPopup.masterView.showPage('result');	
		loading_elem.hide();		
	});

	/*
	var scripts_text = '';
	var selected = Scripts.getSelected();
	
	if (!selected.length)
		return false;
	
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
				openPopup.masterView.addResult(data);
				openPopup.masterView.showPage('result');	
				loading_elem.hide();		
			} catch(e) {}
		}
	});	*/
}


var openPopup = function() {

	if (!openPopup.opened) {
		openPopup.opened = true;
		$('body').append(container);
	
		container.dialog({
			minWidth: 720,
			maxHeight: 800,
			title: TITLE + ' <a class="poweredby" href="' + CLOSURE_URL + '" target="_blank">powered by Google Closure</a>',
			modal: true,
			create: function( event, ui ) {
				openPopup.masterView = new ContentView({
					el: container
				});
			},
			buttons: {
				'Compile': getCompile,
				'Options': function(e) {
					var page = 'options';
					
					$(e.currentTarget).find('span').text(page);
					
					if (openPopup.masterView.showPage().is('.' + page)) 
						page = 'main';
					else
						$(e.currentTarget).find('span').text('main');
					
					openPopup.masterView.showPage(page);
				}
			}
		});
		
	} else 
		container.dialog( "open" );
	
}

