var Image = require("parse-image");

Parse.Cloud.define("resizeImage", function(request, response) {
  	var query = new Parse.Query(request.params.itemType);
  	query.select('imageFull');
  	query.get(request.params.itemID, {
	    success: function(item) {
			if (!item.get("imageFull")) {
	       		response.error("No image available");
	        	return;
	      	}

	      	Parse.Cloud.httpRequest({
	        	url: item.get("imageFull").url()

	      	}).then(function(response) {
	        	var image = new Image();
	        	return image.setData(response.buffer);

	      	}).then(function(image) {
	        	var heightToWidthRatio = request.params.wantedHeight /  request.params.wantedWidth;
	        	var currentHeightToWidthRatio = image.height() / image.width();
	        	var ratioDiff = heightToWidthRatio - currentHeightToWidthRatio;

	        	var width = ratioDiff > 0? (request.params.wantedWidth/request.params.wantedHeight) * image.height() : image.width();
	        	// console.log("width:"+width);
	        	var height = ratioDiff > 0? image.height() : width * heightToWidthRatio;
	        	// console.log("height:"+height);
	        	var left = (image.width() - width) / 2;
	        	if (left < 0) left = 0;
	        	// console.log("left:"+left);
	        	var top = (image.height() - height) / 2;
	        	if (top < 0) top = 0;
	        	// console.log("top:"+top);

        		return image.crop({
        	  		left: left,
        	  		top: top,
        	  		width: width,
        	  		height: height
        		});
	      	}).then(function(image) {
	        	// Resize the image
	        	return image.scale({
	          		width: request.params.wantedWidth,
	          		height: request.params.wantedHeight
	        	});
	      	}).then(function(image) {
	        	// Make sure it's a JPEG to save disk space and bandwidth.
	        	return image.setFormat("JPEG");

	      	}).then(function(image) {
	        	// Get the image data in a Buffer.
	        	return image.data();

	      	}).then(function(buffer) {
	        	// Save the image into a new file.
	        	var base64 = buffer.toString("base64");
	        	var cropped = new Parse.File(request.params.fileName, { base64: base64 });
	        	return cropped.save();

	      	}).then(function(cropped) {
	        	// Attach the image file to the original object.
	        	item.set(request.params.saveField, cropped);
	        	item.save(null, {
	          		success: function(item) {
	          			console.log("new image has been saved");
	            		response.success();
	          		},
	          		error: function(item, error) {
	            		response.error(error.Message);
	          		}
	        	});
	      	});
	    },
	    error: function(object, error) {
	      	response.error(error);
	    }
  	}); 
});

Parse.Cloud.define('editUser', function(request,response) {
	Parse.Cloud.useMasterKey();

	//Security
	if (request.user.get("accessLvl") < 4) {
		response.error("Du har ikke tilladelse til denne handling");
		return;
	}

	var user = new Parse.User();
	user.id = request.params.itemID;
	user.set('name', request.params.name);
	user.set("searchName", request.params.searchName);
	user.set("accessLvl", request.params.accessLvl);
	user.save(null, {
		success:function(item) {
			response.success(item);
		}, error:function(item, error) {
			response.error(error);
		}
	});

});

Parse.Cloud.define('createUser', function(request,response) {
	//Security
	if (request.user.get("accessLvl") < 4) {
		response.error("Du har ikke tilladelse til denne handling");
		return;
	}

	var user = new Parse.User();
	user.set("name", request.params.name);
	user.set("searchName", request.params.searchName);
	user.set("email", request.params.email);
	user.set("username", request.params.email);
	user.set("password", request.params.password);
	user.set("accessLvl", request.params.accessLvl);
	user.signUp(null, {
	    success:function(item) {
	        response.success(item);
	    }, error: function(item, error) {
	        response.error(error);
	    }
	});
});

Parse.Cloud.define('removeUser', function(request,response) {
	Parse.Cloud.useMasterKey();

	//Security
	if (request.user.get("accessLvl") < 4) {
		response.error("Du har ikke tilladelse til denne handling");
		return;
	}

	var user = new Parse.User();
	user.id = request.params.itemID;
	user.destroy({
	    success: function(item) {
	        response.success();
	    },
	    error: function(item, error) {
	        response.error(error);
	    }
	});
});

Parse.Cloud.define('getImageDataURL', function(request,response) {
  	Parse.Cloud.httpRequest({
    	url: request.params.imgUrl

  	}).then(function(response) {
    	var image = new Image();
    	return image.setData(response.buffer);

  	}).then(function(image) {
    	// Get the image data in a Buffer.
    	return image.data();

  	}).then(function(buffer) {
    	// Save the image into a new file.
    	var base64 = buffer.toString("base64");
    	response.success(base64);
  	});
});