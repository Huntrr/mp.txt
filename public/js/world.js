//DEF WORLD OBJECT
var World = function(Socket, Console) {
  
  var socket = Socket;
  var console = Console;
  var map;

  //helper methods
  
  //Define some variables that render functions will share
  var doc = document
  var $div = $(doc.getElementById("world"));
  var $textSpan = $(doc.getElementById("char-span"));
  //text height and width
  var textWidth = $textSpan.width();
  var textHeight = $textSpan.height();
  //div height and width
  var windowWidth = $div.width();
  var windowHeight = $div.height();
  //Height and Width in number of characters
  var width = windowWidth / textWidth;
  var height = windowHeight / textHeight;
  
  var redefine = function() {
    textWidth = $textSpan.width();
    textHeight = $textSpan.height();
    //div height and width
    windowWidth = $div.innerWidth();
    windowHeight = $div.innerHeight();
    //Height and Width in number of characters
    width = windowWidth / textWidth + 5;
    height = windowHeight / textHeight;
  }
  
  //Rendering functions
  var setupDOM = function () {
    redefine();
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var $span = $(doc.createElement("span"));
        $span.attr("id", x + "," + y);
        $span.text("x");
        $div.append($span);
      }
      var $br = $(doc.createElement("br"));
      $div.append($br);
    }
  }
  
  var renderFull = function () {
    var playerPos = [10, 10];
    var renderPos = [playerPos[1] - (height / 2), playerPos[0] - (width / 2)];
    
    if (renderPos[0] < 0) {
      renderPos[0] = 0;
    };
    if (renderPos[1] < 0) {
      renderPos[1] = 0;
    };
    if (renderPos[0] > width) {
      renderPos[0] = width;
    };
    if (renderPos[1] > height) {
      renderPos[1] = height;
    };
    
//    loop through the "below" array
    for (var y = renderPos[1]; y < renderPos[1] + height; y++) {
      for (var x = renderPos[0]; x < renderPos[0] + width; x++) {
        var posx = x - renderPos[0]
        var posy = y - renderPos[1]
        //get span
        var $span = $(doc.getElementById(posx + "," + posy));
        //set attribute of span
        $span.css("color", map.tiles[y][x].color)
        $span.text(map.tiles[y][x].tile);
      }
    }
    //Entity code commented out because it's not functional yet
    /*for (var i = 0; i < map.entities.length; i++) {
      var entity = map.entities[i];
      var posx = entity.x - renderPos[0];
      var posy = entity.y - renderPos[1];
      if (posx > 0 && posx < width &&
          posy > 0 && posy < height) {
        //get span
        var $span = $(doc.getElementById(posx + "," + posy));
//        $span.css("color", entity.color)
        $span.text(entity.tiles);
//        $span.attr("data-player", entity.name);
        $span.attr("class", "entity")
        
      }
    } */
  }
  
  //SETUP LISTENERS
  socket.on('world.load', function (data) {
    map = JSON.parse(data.json);
    setupDOM();
    renderFull();
    socket.emit('world.load', { type: 'ack' });
  });
  
  //everything all set up right
  console.post("world loaded");
  
  //public methods
  return {
    detach: function() {
      socket.removeAllListeners();
    }
  };
}