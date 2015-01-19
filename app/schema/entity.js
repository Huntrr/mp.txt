var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var entitySchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
  x: Number,
  y: Number,
  character: String,
  color: String,
  behavior: String,
  description: String
});

module.exports = mongoose.model('Entity', entitySchema);
