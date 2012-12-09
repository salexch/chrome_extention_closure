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
			styles_text += '' + this.get('text').replace(/;\s+/ig, ';')
												.replace(/}\s+/ig, '}')
												.replace(/{\s+/ig, '{')
												//from http://upshots.org/javascript/javascript-regexp-to-remove-comments
												.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '') 
												.replace(/\t/ig, '');
		});
		
		_.defer(function() {
			dfd.resolve(styles_text);
		});
		
		return dfd.promise();
	}

});

var Styles = new StylesCollection;



