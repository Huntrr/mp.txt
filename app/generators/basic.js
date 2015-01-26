var Tiles = require('./tiles');

function BasicGenerator(options, WIDTH, HEIGHT) {
  this.options = options;
  this.tiles = options.tiles;
  this.WIDTH = WIDTH;
  this.HEIGHT = HEIGHT
}

BasicGenerator.prototype.genMap = function() {
  var tiles = this.tiles;
  var HEIGHT = this.HEIGHT;
  var WIDTH = this.WIDTH;
  
  var map = [];
        for (var y = 0; y < HEIGHT; y++) {
          var row = [];
          for (var x = 0; x < WIDTH; x++) {
            if (y == 0) {                       //top row
              row.push(tiles.border);
            } else if (y > 0 && y < HEIGHT-1) { //middle stuff
              if (x == 0) {                     //far left
                row.push(tiles.border);
              } else if (x > 0 && x < WIDTH-1) {//middle stuff
                row.push(tiles.base);
              } else if (x == WIDTH-1) {        //far right
                row.push(tiles.border);
              }
            } else if (y == HEIGHT-1) {         //bottom row
              row.push(tiles.border);
            }
          }
          map.push(row);
        }
        return map;
  
}

BasicGenerator.prototype.generate = function() {
  //doesn't matter how, this just has to return an object with {tiles, roof, entities, objects}
  var obj = {};
  obj.entities = [];
  obj.objects = [];
  obj.tiles = this.options.genBelow(this);
  obj.roof = this.options.genAbove(this);
  
  return obj;
}

module.exports = BasicGenerator;