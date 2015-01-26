var mongoose = require('mongoose');
var Object = require('./object');
var Entity = require('./entity');
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

roomSchema.pre('save', function(next) {
  this.markModified('inside.tiles');
  this.markModified('inside.roof');
  
  next();
});


roomSchema.methods.generateRoom = function (Generator, cb) {
  var map = Generator.generate(/* in case we ever have parameters here */);
  
  this.inside.description = map.desc;
  this.inside.tiles = map.tiles;
  this.inside.roof = map.roof;
  
  var $this = this;
  var i;
  var length = map.entities.length;
  var newEntity;
  
  for(i = 0; i < length; i++) {
    newEntity = new Entity(map.entities[i]);
    newEntity.room = this._id;
    newEntity.save();
  }
  
  length = map.objects.length;
  var newObject;
  
  for(i = 0; i < length; i++) {
    newObject = new Object(map.objects[i]);
    newObject.room = this._id;
    newObject.save(function(err, obj) {
      if(err) return console.log(err.message);
      $this.inside.objects.push(obj._id);
      $this.save();
    });
  }
  
  this.save(cb);
}

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
    
    json.objects = {};
    var objLength = room.inside.objects.length;
    var obj;
    for(var j = 0; j < objLength; j++) {
      obj = room.inside.objects[j];
      json.objects[obj.id] = obj;
    }
    
    $this.getEntities(function (err, entities) {
      if(err) { return cb(err, null); }
      json.entities = {};
      var length = entities.length;
      var entity;
      
      for(var i = 0; i < length; i++) {
        entity = entities[i];
        
        if(entity.behavior === "player") {
          if(entity.belongsTo && entity.belongsTo.loggedIn) {
            json.entities[entity.id] = entity;
          }
        } else {
          json.entities[entity.id] = entity;
        }
      }
      
      
      return cb(err, JSON.stringify(json));
    });
  });
};

module.exports = mongoose.model('Room', roomSchema);
