var cssParser = (function () {


	var rules = {},
		selector_sorted = {},
		properties_sorted = {};

	var rules_regexp = /([^}]+)(\})/ig,
		selector_regexp = /^([^{]+)?/ig,
		css_regexp = /(\{)([^]+)(\})/ig,
		properties_regexp = /.+(?=:)/ig;
	
	
	function getRules(str) {
		var styles_list,
			selector_text,
			css_text,
			properties;
			
		if (styles_list = str.match(rules_regexp)) {
			for(var i = styles_list.length - 1; i > 0; i--) {
				selector_text = styles_list[i].match(selector_regexp);
				css_text = styles_list[i].replace(css_regexp, function() {
					return arguments[2];
				});	
				properties = css_text.match(properties_regexp);
				
				
				selectors = selector_text.split(',').map(function(selector) {
					// Remove the spaces before the things that should not have spaces before them.
					// But, be careful not to turn "p :link {...}" into "p:link{...}"
					// Swap out any pseudo-class colons with the token, and then swap back.
					selector = selector.replace(/(^|\})(([^\{:])+:)+([^\{]*\{)/g, function (m) {
						return m.replace(":", "___YUICSSMIN_PSEUDOCLASSCOLON___");
					});
					selector = selector.replace(/\s+([!{};:>+\(\)\],])/g, '$1');
					selector = selector.replace(/___YUICSSMIN_PSEUDOCLASSCOLON___/g, ":");				
				
					return selector;
				});
				
			}	
		}
		
		return styles_list
	}








	return {
		
		addFilter: _addFilter
	}


})();