var mongoose = require('mongoose');
var Object = require('./object');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
  world: Schema.Types.ObjectId,
  x: Number,
  y: Number,
  inside: { description: String, 
            tiles: Schema.Types.Mixed,
            roof: Schema.Types.Mixed,
            objects: [{ type: Schema.Types.ObjectId, ref: 'Object' }]
          },
  tag: String
});

//logistics stuffs
roomSchema.pre('remove', function(next) {
  var length = this.objects.length;
  for(var i = 0; i < length; i++) {
    Object.remove({_id: this.objects[i]}).exec();
  }
  
  next();
});

//returns an array of all entities in this room
//attach callback in form of < function cb(err, entities) >
roomSchema.methods.getEntities = function (cb) {
  return this.model('Entity').find({room: this._id}).populate('belongsTo', 'name description donor admin lastMessage').exec(cb);
};


//returns stringified json for sending to client
//cb = function cb(err, string)
roomSchema.methods.getJSON = function (cb) {
  var json = {};
  var $this = this;
  
  this.populate('inside.objects', function(err, room) {
    if(err) { return cb(err, null); }
    
    json.x = room.x;
    json.y = room.y;
    
    json.desc = room.inside.description;
    json.tiles = room.inside.tiles;
    json.roof = room.inside.roof;
    json.objects = room.inside.objects;
    
    $this.getEntities(function (err, entities) {
      if(err) { return cb(err, null); }
      json.entities = [];
      var length = entities.length;
      var entity;
      
      for(var i = 0; i < length; i++) {
        entity = entities[i];
        
        if(entity.belongsTo) {
          if(entity.belongsTo.loggedIn) {
            json.entities.push(entity);
          }
        } else {
          json.entities.push(entity);
        }
      }
      
      
      return cb(err, JSON.stringify(json));
    });
  });
};

module.exports = mongoose.model('Room', roomSchema);
