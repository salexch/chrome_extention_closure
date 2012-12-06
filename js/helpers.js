Number.prototype.padding = function(n) {
	num = '' + this;
	if (num.length < n)
		while (num.length !=n ) 
			num = '0' + num;
	
	return num;	
}