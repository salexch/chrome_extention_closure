	var settings = {};
	var save_button = $('<button />').text('save').click(save_options);
	var log = $('<div />');

	function save_options() {
		localStorage['closure_compiler'] = JSON.stringify(settings);

		// Update status to let user know options were saved.
		log.html("Options Saved.");
		setTimeout(function() {
			log.html('');
		}, 750);
	}

	function restore_options() {
		var settings;
		
		try {
			settings = $.parseJSON(localStorage['closure_compiler']);
			if (!settings) 
				settings = $.extend({}, options_data);
		} catch (e) {
			settings = $.extend({}, options_data);
		}
		
		return settings;
	}
	
	function drawOptions() {
		$('body').prepend(Mustache.to_html(options_template, settings));	
		
		$('body table:last').append(log).append(save_button);
		
		$('table input').change(function() {
			$('table input').each(function() {
				var elem = $(this);
				var name = elem.attr('name');
				var value = elem.val();
				
				$.each(settings.OptionsCategories, function() {
					$.each(this.Options, function() {
						$.each(this.list, function() {
							if (this.name == name && this.value == value) {
								this.checked = elem.is(':checked');
								return false;
							}	
						});
					});
				});
			}); 
		});
	}

	
	settings = restore_options();

	$(function() {
		drawOptions();
	});
