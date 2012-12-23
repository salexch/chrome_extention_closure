Number.prototype.padding = function(n) {
	num = '' + this;
	if (num.length < n)
		while (num.length !=n ) 
			num = '0' + num;
	
	return num;	
}

function convertImageToBase64( img ) {
	if (!convertImageToBase64.canvas) 
		convertImageToBase64.canvas = document.createElement("canvas");

	canvas = convertImageToBase64.canvas;
	
	//$('body').append($(img));
	//console.log($(img), $(img).width(), $(img).height())
	//console.log(img, img.width, img.height)
	canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL("image/png");

    return dataURL;
}

$.image = function(src) {
    return $.Deferred(function (task) {
        var image = new Image();
        image.onload = function () { task.resolve(image); }
        image.onerror = function () { task.reject(); }
        image.src = src;
    }).promise();
}