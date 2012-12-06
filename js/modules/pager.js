(function() {

	this.Loader = (function() {

		var loader = $('<div />', {
			'class': 'loader'
		}).add($('<div />', {
			'class': 'loader-bg'
		}));
		
		
		return {
			show: function() {
				$('.container').append(loader);
			},
			hide: function() {
				$(loader).remove();
			}
		};
	})();
	

	var crossFadeEffect = function(start_elem, finish_elem) {
		var dfd = $.Deferred();
		var start_elem_pos = start_elem.position();
		
		start_elem.fadeOut(600, function() {
			$(document).trigger('pageUnloaded');
			$(this).remove();
		});
		
		finish_elem.css({
			position: 'absolute',
			top: (start_elem_pos.top || 144) + 'px',			
		}).hide().fadeIn(1000, function() {
			dfd.resolve();
		});		
		
		return dfd.promise();
	};
	
	
	var pushRightEffect = function(start_elem, finish_elem) {
		var dfd = $.Deferred();

		var start_elem_pos = start_elem.position();
		var start_elem_width = start_elem.width();
		
		start_elem.animate({
			right: '-1280px'
		}, 1000, function() {
			$(document).trigger('PageUnloaded');
			$(this).remove();
		});
		
		finish_elem.css({
			position: 'absolute',
			top: start_elem_pos.top + 'px',
			right: start_elem_width + 'px'
		}).animate({
			right: '0'
		}, 1000, function() {
			dfd.resolve();
		});		
		
		return dfd.promise();
	};
	
	
	var SlideDownEffect = function(start_elem, finish_elem) {
		var dfd = $.Deferred();
		
		start_elem.css({
			zIndex: '0'
		});
		
		finish_elem.css({
			zIndex: '1',
			height: 0
		}).animate({
			height: '100%'
		}, 1000, function() {
			start_elem.trigger('PageUnloaded');
			$(this).remove();
			dfd.resolve();
		});			
		
		return dfd.promise();
	};
	
	
	var effects = {
		crossFade: crossFadeEffect,
		pushRight: pushRightEffect,
		slideDown: SlideDownEffect
	};
	
	
	var playCompleteSound = function(page_func) {
		if (page_func['audio'] && page_func['audio']['manager'] && page_func['audio']['sounds']['done'])
			page_func['audio']['manager'].play(page_func['audio']['sounds']['done']);
	};
	
	
	var Pager = Backbone.Pager = function(options) {
		this._configure(options || {});
		this.initialize.apply(this, arguments);
		this._animation_status = false,
		this._animated_elems = {
			curr_page_elem: null,
			new_page_elem: null
		};
		this._last_page_func = [];	
	};		
	
	  // List of view options to be merged as properties.
	  var PagerOptions = [];	
	
	_.extend(Pager.prototype, Backbone.Events, {
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function(){},	
		el: null,
		tagName: 'div',
		attributes: {},
		effects: effects,
		Loader: Loader,
	    _configure: function(options) {
	        if (this.options) options = _.extend({}, this.options, options);
	        for (var i = 0, l = PagerOptions.length; i < l; i++) {
	          var attr = PagerOptions[i];
	          if (options[attr]) this[attr] = options[attr];
	        }
	        this.options = options;
	      },
	    getCurrPage: function() {
	    	return _.last(this._last_page_func);
	    },  
		open: function( page_func, args, effect ) {

			effect  =  this.effects[effect || 'crossFade'];

			Loader.show();
			
			if (this._animation_status) {
				this._animated_elems.curr_page_elem.stop().remove();
				this._animated_elems.new_page_elem.stop().show();
				Loader.hide();
				this._animation_status = false;
			}

			this.el = $(this.el);
			var curr_page_elem = this.el.find('>' + this.tagName + ':first').css({
				zIndex:1
			});
			
			var new_page_elem = $('<' + this.tagName + '/>', this.attributes);
			
			this._animated_elems = {
				curr_page_elem: curr_page_elem,
				new_page_elem: new_page_elem						
			};
			
			this.el.append(new_page_elem);

			if (this._last_page_func.length) 
				(this._last_page_func.pop())._unload();
				
			var that = this;

			
			$.when(page_func['_load'](new_page_elem, args)).then(function(data) {

				that._last_page_func.push(page_func);
				
				that._animation_status = true;

				playCompleteSound(page_func);
				
				$.when(effect(curr_page_elem, new_page_elem)).then(function() {
					$(document).trigger('PageLoaded', [new_page_elem]);
					
					that._animation_status = false;
					Loader.hide();
				});
				
			}).fail(function(errors) {
				log('@---- Error in ' + page_func.name + ' ------@');

				var error_view = ('undefined' != (window['Error' + page_func.type])) ? window['Error' + page_func.type] : false; 

				if (error_view) {
					$.when(error_view._load(new_page_elem, errors)).then(function() {
						curr_page_elem.remove();
						
						playCompleteSound(error_view);
						
						$('#splash').remove();
						Loader.hide();
					});
				}
			});

			
		}
	});

	// The self-propagating extend function that Backbone classes use.
	var extend = function (protoProps, classProps) {
		var child = inherits(this, protoProps, classProps);
		child.extend = this.extend;
		return child;
	};

	
	
	var Page = Backbone.Page = function(options) {
		this._configure(options || {});
		this.initialize.apply(this, arguments);
		
		var page_elem = null;
		
		this._load = function(el) {
			log('Init ' + this.name + ' ' + this.type);
			
			this._selecteble_elems = [];
			page_elem = el;

			//return this.load(el, Array.prototype.slice.call( arguments, 1 ));
			return this.load.apply(this, arguments);
		};
		
		this._unload = function() {
			log('Unload ' + this.name + ' ' + this.type);
			
			this._selecteble_elems = [];
			
			return this.unload(page_elem);
		};
	};
	
	  // List of view options to be merged as properties.
	  var PageOptions = [];	
	
	_.extend(Page.prototype, Backbone.Events, {
	    // Initialize is an empty function by default. Override it with your own
	    // initialization logic.
	    initialize: function(){},	
	    _configure: function(options) {
	        if (this.options) options = _.extend({}, this.options, options);
	        for (var i = 0, l = PageOptions.length; i < l; i++) {
	          var attr = PageOptions[i];
	          if (options[attr]) this[attr] = options[attr];
	        }
	        this.options = options;
	      },	
	      
	    type: 'Page',
	    name: 'default name',
	      
	    _selecteble_elems: [],
	    selectebleSelector: '.selecteble',
	    selectedSelector: '.selected',
	    staticSelectebleElems: [],
	    
	    kbMoveToNext: function(pos) {
	    	return this._selecteble_elems.filter(function() {
				return ($(this).attr('data-pos') == '[' + pos[0] + ', ' + pos[1] + ']');
			}).first().trigger('mouseenter.keyboard');
	    },
	    kbInitialize: function(el) {
			if (!this._selecteble_elems.length)
				this._selecteble_elems = el.find(this.selectebleSelector).add(this.staticSelectebleElems);
	    },
	    kbGetCurr: function() {
	    	return this._selecteble_elems.filter(this.selectedSelector).first();
	    },
	    kbCurrentElementPos: function() {
			var selected  = this.kbGetCurr();
			
			if (!selected.length)
				selected = this._selecteble_elems.filter(':first');

			var pos = selected.data('pos');
			
			var x = pos ? pos[0] : false;
			var y = pos ? pos[1] : false;
			
			if (!x || !y) 
				pos = $.parseJSON(selected.attr('data-pos'));
			
			return pos;
	    },
	    
	    keyboard: function(key) {
	    	try {
	    		return this.view.KeyboardNavigation(key);
	    	} catch(e) {}
	    	
	    },
	    
	    resetSelection: function() {
	    	//override in page script!
	    },
	    
		load: function() {	
		},
		unload: function() {
			
		}
	});      
	
	// Set up inheritance for the model, collection, and view.
	Pager.extend = Page.extend = extend;

	  // Shared empty constructor function to aid in prototype-chain creation.
	  var ctor = function(){};
	  
	  // Helper function to correctly set up the prototype chain, for subclasses.
	  // Similar to `goog.inherits`, but uses a hash of prototype properties and
	  // class properties to be extended.
	  var inherits = function(parent, protoProps, staticProps) {
	    var child;

	    // The constructor function for the new subclass is either defined by you
	    // (the "constructor" property in your `extend` definition), or defaulted
	    // by us to simply call the parent's constructor.
	    if (protoProps && protoProps.hasOwnProperty('constructor')) {
	      child = protoProps.constructor;
	    } else {
	      child = function(){ parent.apply(this, arguments); };
	    }

	    // Inherit class (static) properties from parent.
	    _.extend(child, parent);

	    // Set the prototype chain to inherit from `parent`, without calling
	    // `parent`'s constructor function.
	    ctor.prototype = parent.prototype;
	    child.prototype = new ctor();

	    // Add prototype properties (instance properties) to the subclass,
	    // if supplied.
	    if (protoProps) _.extend(child.prototype, protoProps);

	    // Add static properties to the constructor function, if supplied.
	    if (staticProps) _.extend(child, staticProps);

	    // Correctly set child's `prototype.constructor`.
	    child.prototype.constructor = child;

	    // Set a convenience property in case the parent's prototype is needed later.
	    child.__super__ = parent.prototype;

	    return child;
	  };	
	
})();


