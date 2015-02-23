var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user');

var entitySchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
  x: { type: Number, default: -1 },
  y: { type: Number, default: -1 },
  body: Schema.Types.Mixed,
  character: { type: String, default:'o' },
  color: String,
  behavior: String,
  description: String,
  belongsTo: { type: Schema.Types.ObjectId, ref: 'User' }
});

entitySchema.pre('save', function(next) {
  this.markModified('body');
  
  var now = new Date();
  if(this.belongsTo) {
    this.model('User').update({_id: this.belongsTo}, {lastMessage: now}, function(err, user) {
      if(err) console.log("While saving entity", err.message);
    });
  }
  next();
});

entitySchema.static('getColor', function(playerId, callback) {
  this.findOne({belongsTo: playerId}, function(err, entity) {
    if(err) console.log(err.message);
    
    callback([entity.color, entity.character]);
  });
});

module.exports = mongoose.model('Entity', entitySchema);
