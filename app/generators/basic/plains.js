var BasicGenerator = require('./../basic');
var Tiles = require('./../tiles');



var options = {
  id: "plains",
  tiles: {
    base: Tiles.shadingLight,
    texture: Tiles.shadingMed,
    border: Tiles.shadingDark
  },
  desc: "Beautiful grassy plains. Maybe you'll find a village!",
  spawnable: [ /* not gonna implement yet cuz this is more complicated than you think, I think */ ],
  genBelow: function(generator) {
    var map = generator.genMap();
    
    //put custom texture/etc stuff here
    //get all the options through generator (i.e. generator.WIDTH or generator.tiles.base, etc)
    
    return map;
  }, 
  genAbove: function(generator) {
    var map = [];
    return map;
  },
  spawn: function(generator) {
    return [Math.floor(generator.WIDTH / 2), Math.floor(generator.HEIGHT / 2)];
  }
};

module.exports = function(WIDTH, HEIGHT) {
  return new BasicGenerator(options, WIDTH, HEIGHT);
}