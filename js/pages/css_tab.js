var StyleModel = ScriptModel;

var StylesCollection = ScriptsCollection.extend({
	model: StyleModel,
	
	getCurrDocScripts: function() {
		var that = this;
		$('link[rel$="tylesheet"], style').each(function() {

			var id = _.uniqueId('index_');

			if ($(this).attr('href')) {
				
				var script_obj = {
					id: id,
					src_full: $(this).attr('href')
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

		});	
	},
	
	compile: function() {
		var dfd = $.Deferred();
		
		var styles_text = '';
		var selected = this.getSelected();
		
		if (!selected.length)
			dfd.resolve();
		

		$.each(selected, function() {
			styles_text += YAHOO.compressor.cssmin(this.get('text'));
		});

		if (SETTINGS.image_convert)	 {
			var imgs_srcs = [];
			var imgs_ids = [];
			
			console.groupCollapsed('Converting Images:'); 
			
			styles_text = styles_text.replace(/(\()([^)]{0,}(png|jpg|jpeg|PNG|JPG|JPEG))(\))/ig, function() {
				var id = _.uniqueId('DataUriPlaceholder_');
				console.log('#' + id + ' ', 'url(' + arguments[2] + ')');
				
				var url = arguments[2].replace(/\.{2}\//gi, ''); 
				imgs_srcs.push(url);
				imgs_ids.push(id);
				
				return '(' + id + ')';
			});

			console.groupEnd();
			
			//$.when.apply( $, $.map( imgs_srcs, $.image ) ).then(function() { 
			$.when.apply( this, $.map( imgs_srcs, $.image ) ).then(function() {
				$.each(arguments, function(i, img) {
					styles_text = styles_text.replace(new RegExp(imgs_ids[i]), convertImageToBase64(img));
				});
				dfd.resolve(styles_text);
			});
			
		} else
			_.defer(function() {
				dfd.resolve(styles_text);
			});
		
		return dfd.promise();
	}

});

var Styles = new StylesCollection;



