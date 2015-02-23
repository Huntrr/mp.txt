//DEF WORLD OBJECT
var World = function(Socket, Console) {
  
  var socket = Socket;
  var console = Console;
  var map;
  var playerEntity;

  //helper methods
  var updatePlayer = function() {
    playerEntity = map.entities[playerEntity._id];
  }
  
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
  width -= 1;
  var height = windowHeight / textHeight;
//  height -= 1;
  
  var redefine = function() {
    textWidth = $textSpan.width();
    textHeight = $textSpan.height();
    //div height and width
    windowWidth = $div.innerWidth();
    windowHeight = $div.innerHeight();
    //Height and Width in number of characters
    width = windowWidth / textWidth - 1;
    width -= 1;
    height = windowHeight / textHeight;
//    height -= 1;
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
  
  var getRenderPos = function(_x, _y) {
    var halfHeight = Math.floor(height / 2);
    var halfWidth = Math.floor(width / 2);
    var x = Math.max(0, _x - halfWidth);
    var y = Math.max(0, _y - halfHeight);
    if(x + width >= map.tiles[0].length) {
      x = Math.floor(map.tiles[0].length - width);
    }
    if(y + height >= map.tiles.length) {
      y = Math.floor(map.tiles.length - height);
    }
    
    return [x, y];
  }
  
  var renderFull = function () {
    updatePlayer();
    var playerPos = [playerEntity.x, playerEntity.y];
    
    var renderPos = getRenderPos(playerPos[0], playerPos[1]);
    
    //loop through the "below" array
    var tile;
    for (var y = 0; y < (height); y++) {
      for (var x = 0; x < (width); x++) {
        var posX = x + renderPos[0];
        var posY = y + renderPos[1];
        //get span
        var $span = $(doc.getElementById(x + "," + y));
        //set attribute of span
        if(posY < map.tiles.length && posX < map.tiles[posY].length) {
          tile = map.tiles[posY][posX];
          $span.css("color", tile.color);
          $span.text(tile.tile);
        }
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
  
  /*$(window).resize(function() {
    setupDOM();
    renderFull();
  });*/
  
  //SETUP LISTENERS
  socket.on('world.load', function (data) {
    map = JSON.parse(data.json);
    
    playerEntity = map.entities[data.player_entity._id];
    console.post(playerEntity.body); //2d array
    console.post('(' + playerEntity.x + ', ' + playerEntity.y + ')');
    
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