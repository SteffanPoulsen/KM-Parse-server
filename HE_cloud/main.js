var Image = require("parse-image");

Parse.Cloud.define("createThumbnail", function(request, response) {
  Parse.Cloud.useMasterKey();

  var query = new Parse.Query(Parse.User);
  query.get(request.params.userID, {
    success:function(user) {
      var imgfile = user.get("thumbnail");
      var imgfilename = imgfile.name();

      if (typeof imgfile != "undefined") {
        var imgurl = imgfile.url();
        Parse.Cloud.httpRequest({
          url: imgurl
        }).then(function(response) {
          var image = new Image();
          return image.setData(response.buffer);
        }).then(function(image) {
          // Resize the image.
          var aspect = image.height() / image.width();
      
          var maxWidth = 128;
          if (image.height() > 128 || image.width() > 128) {
            if (aspect != 1) {
              //Scale
              var lowest = aspect < 1? image.height() : image.width();
              var scaleFactor = lowest / 128;
              // console.log("scalefactor: " + scaleFactor);
              var scaleWidth = Math.round(image.width() / scaleFactor);
              // console.log("scalewidth: " + scaleWidth);
              var scaleHeight = Math.round(image.height() / scaleFactor);
              // console.log("scaleheight: " + scaleHeight);
              image.scale({
                width: scaleWidth,
                height: scaleHeight
              });
              
              // Crop
              var topDiff = scaleHeight - 128;
              var topPixel = topDiff > 0? Math.floor(topDiff / 2) : 0;
              // console.log("toppixel: " + topPixel);
              var leftDiff = scaleWidth - 128;
              var leftPixel = leftDiff > 0? Math.floor(leftDiff / 2) : 0;
              // console.log("leftpixel: " + leftPixel);
              image.crop({
                left: leftPixel,
                top: topPixel,
                width: 128,
                height: 128
              });
            } else {
              image.scale({
                width: 128,
                height: 128
              });
            }
           
            saveNewImage(image).then(function(buffer) {
              // Save the image into a new file.
              var base64 = buffer.toString("base64");
              var cropped = new Parse.File(imgfilename, {
                base64: base64
              });
              return cropped.save();
            }).then(function(cropped) {
              // Attach the image file to the original object.
              user.set("thumbnail", cropped);
              return user.save();
            }).then(function(result) {
              response.success();
            }, function(error) {
              response.error(error);
            });
          } else {
            response.success();
          }
        });

        saveNewImage = function(image) {
          return image.data();
        }
      } else {
        response.success();
      }
    }, error:function() {
      response.error();
    }
  });
});

/*  Params:
    - field : String, which column to sort the user list by
    - limit : int, how many results to return
*/

Parse.Cloud.define('GetUserLeaderboard', function(request,response) {
  var query = new Parse.Query(Parse.User);
  query.descending(request.params.field);
  query.limit(request.params.limit);
  query.select('thumbnail', 'customUsername', 'costume', request.params.field);
  query.notEqualTo('developer', true);
  query.find({
    success:function(list) {
      var str = "";
      for (var i=0;i<list.length;i++) {
        var thisUser = list[i];
        var imgUrl = thisUser.get('thumbnail') != undefined? thisUser.get('thumbnail')._url : "";
        var userName = thisUser.get('customUsername') != undefined? thisUser.get('customUsername') : "SP#RREV#P";
        var score = thisUser.get(request.params.field);
        var costume = thisUser.get('costume') != undefined? thisUser.get('costume') : '';
        if (score <= 0) continue; 
        str += ">" + i.toString() + "<" + userName + "<" + imgUrl + "<" + score.toString() + "<" + costume;
      }
      response.success(str);
    }
  });

});