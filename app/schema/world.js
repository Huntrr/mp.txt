var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Room = require('./room');

var worldSchema = new Schema({
  rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
  name: String,
  description: String
});

worldSchema.methods.newRoom = function(room, cb) {
  var world = this;
  room.world = world._id;
  var newRoom = new Room(room);
  newRoom.save(function (err, r) {
    if(err) { return cb(err, null); }
    
    world.rooms.push(r._id);
    world.save(function (err, world) {
      if(err) { return cb(err, null); }
      
      cb(err, r);
    });
  });
};

worldSchema.methods.generateRoom = function(generator, x, y, tag, cb) {
  var world = this;
  var newRoom = new Room();
  newRoom.x = x;
  newRoom.y = y;
  newRoom.tag = tag;
  
  newRoom.generateRoom(generator, function(err, room) {
    if(err) return cb(err, null);
    world.rooms.push(room._id);
    world.save(function(err, world) {
      if(err) return cb(err, null);
      cb(err, room);
    });
  });
}

module.exports = mongoose.model('World', worldSchema);
