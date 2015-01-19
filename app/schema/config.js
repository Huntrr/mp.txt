var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var configSchema = new Schema({
  key: {type: String, unique: true},
  value: Schema.Types.Mixed
});

module.exports = mongoose.model('Config', configSchema);