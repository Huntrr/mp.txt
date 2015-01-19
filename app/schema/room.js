var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
  world: Schema.Types.ObjectId,
  x: Number,
  y: Number,
  inside: { description: String, 
            tiles: Schema.Types.Mixed,
            roof: Schema.Types.Mixed,
            objects: [{ type: Schema.Types.ObjectId, ref: 'Object' }]
          }
});

//returns an array of all entities in this room
//attach callback in form of < function cb(err, entities) >
roomSchema.methods.getEntities = function (cb) {
  return this.model('Entity').find({room: this._id}, cb);
};


//returns stringified json for sending to client
//cb = function cb(err, string)
roomSchema.methods.getJSON = function (cb) {
  var json = {};
  
  this.populate('inside.objects', function(err, room) {
    if(err) { return cb(err, null); }
    
    json.x = room.x;
    json.y = room.y;
    
    json.desc = room.inside.description;
    json.tiles = room.inside.tiles;
    json.roof = room.inside.roof;
    json.objects = room.inside.objects;
    
    this.getEntities(function (err, entities) {
      if(err) { return cb(err, null); }
      
      json.entities = entities;
      return cb(err, JSON.stringify(json));
    });
  });
};

module.exports = mongoose.model('Room', roomSchema);
