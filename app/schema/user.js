var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  entity: { type: Schema.Types.ObjectId, ref: 'Entity' },
  name: String,
  email: String,
  password: String,
  description: {type: String, default: ''},
  dateBegin: {type: Date, default: Date.now},
  donor: {type: Boolean, default: false},
  admin: {type: Boolean, default: false}
});

//generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

//virtual for the user token
userSchema.virtual('token').get(function () {
  return {_id: this._id, name: this.name, email: this.email, description: this.description, donor: this.donor, admin: this.admin};
});

//create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
