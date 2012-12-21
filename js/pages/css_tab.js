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
					src_full: '',
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
		

		
		if (SETTINGS.image_convert) {
			var imgs_srcs = [];
			var imgs_ids = [];
			console.groupCollapsed('Converting Images to base64:'); 
		}
		
		$.each(selected, function() {
			var that = this;
			var compressed = YAHOO.compressor.cssmin(this.get('text'));

			if (SETTINGS.image_convert)	 {
				console.groupCollapsed(that.get('src')); 
				
				styles_text += compressed.replace(/(\()([^)]{0,}(png|jpg|jpeg|PNG|JPG|JPEG))(\))/ig, function() {
					var id = _.uniqueId('DataUriPlaceholder_');
					var css_url = that.get('src_full').replace(/([^\/]+$)/ig, ''); //removes filename
					var img_url = css_url + arguments[2];
					
					console.log(img_url);
					
					imgs_srcs.push(img_url);
					imgs_ids.push(id);
					
					return '(' + id + ')';
				});
				
				console.groupEnd();
			} else {
				styles_text += compressed;
			}
			
		});	
		
		if (SETTINGS.image_convert) {
			console.groupEnd();
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



