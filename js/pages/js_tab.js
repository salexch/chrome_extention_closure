var ScriptModel = Backbone.Model.extend({
	initialize: function() {
		var curr_time = new Date().getTime();
		
		this.set({
			order: this.collection.getNextOrder(),
			load_time: 0,
			start_time: curr_time,
			finish_time: curr_time,
			selected: false
		});
		
		if (this.get('src_full')) 
			this.collection.loadScriptContent(this);
		
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
	
	streams_holder: [],
	
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
	},
	
	
	getCurrDocScripts: function() {
		var that = this;
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
					
				} else  {
					var text = $(this).html();
					
					var script_obj = {
						id: id,
						src: text.replace(/\s/ig, '').substring(0, 40),
						text: text
					};	
				}

				that.add(script_obj);
			}
		});	
	},
	loadScriptContent: function(model) {
		var i = model.get('order');
		var index = i % parallel;
		var stream = this.streams_holder[index];
		
		if (!stream) {
			stream = $.Deferred();
			stream.resolve();
			this.streams_holder.push(stream);
		}
		
		//stream = stream.pipe.call(this.runRequest, model);
		var that = this;
		stream = stream.pipe(function() {
			return that.runRequest(model);
		});
		
	},
	runRequest: function(model) {
		return $.ajax({
			url: model.get('src_full'),
			dataType: 'text',
			success: function(content) {
				var curr_time = new Date().getTime();
				var start_time = model.get('start_time');
				
				var script_obj = {
					src: model.get('src_full').replace(location_href_regexp, ''),
					text: content,
					finish_time: curr_time,
					load_time: (curr_time - start_time) / 1000
				};	
				
				model.set(script_obj);
			}
		});	
	},
	
	compile: function() {
		var scripts_text = '';
		var selected = this.getSelected();
		
		if (!selected.length) {
			var dfd = $.Deferred();
			_.defer(function() {
				dfd.resolve();
			});
			return dfd.promise();
		}	
		
		$.each(selected, function() {
			scripts_text += '\n' + this.get('text');
		});
		
		var params = $.extend({}, closure_post_params, {js_code: scripts_text});
		
		return $.ajax({
			url: CLOSURE_URL+ '/compile' + closure_get_string,
			type: 'POST',
			data: params,
			dataType: 'json'
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


var ScriptsTabView = Backbone.View.extend({

	template:   '<div class="list_control">'+
					'<a class="mark" href="#">All</a>'+
				'</div>'+
				'<ul class="scripts-list"></ul>'+	
				'<div class="stats"></div>',
				
	stats_template: 'Time: <span>{{loading_time}}sec</span>, Total: <span>{{scripts_total}}</span>, Selected: <span>{{selected}}</span>',

	events: {
		'click .mark': 'selectUnselect'
	},
	
	initialize: function() {
		this.collection = this.options.collection;
	
		this.collection.on('load', this.showAll, this);
		this.collection.on('change:selected', this.changeStats, this);
		
		this.$el.html(this.template);
	},

	selectUnselect: function(e) {
		e.preventDefault();
		this.collection.selectUnselect();
	},
	
	changeStats: function() {
		this.$el.find('.stats span:last').html(this.collection.getSelected().length);
	},
	
	addOne: function(model) {
		var view = new ScriptView({model: model});
		this.$el.find('ul').append(view.render().el);
	},
	
	showAll: function() {
		//Scripts.each(this.addOne);
		var loading_time = 0;
		var that = this;
		$.each(this.collection.models, function() {
			that.addOne(this);
			loading_time += this.get('load_time');
		});
		
		var html = Mustache.to_html(this.stats_template, {
			loading_time: loading_time.toFixed(2),
			scripts_total: this.collection.models.length,
			selected: 0
		});
		this.$el.find('.stats').html(html);
	}
	
});