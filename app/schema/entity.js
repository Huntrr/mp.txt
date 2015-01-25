var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var entitySchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
  x: { type: Number, default: -1 },
  y: { type: Number, default: -1 },
  character: String,
  color: String,
  behavior: String,
  description: String,
  belongsTo: { type: Schema.Types.ObjectId, ref: 'User' }
});

entitySchema.static('getColor', function(playerId, callback) {
  this.findOne({belongsTo: playerId}, function(err, entity) {
    if(err) console.log(err.message);
    
    callback([entity.color, entity.character]);
  });
});

module.exports = mongoose.model('Entity', entitySchema);
