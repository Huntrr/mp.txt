var mongoose = require('mongoose');
var Entity = require('./entity');
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
  admin: {type: Boolean, default: false},
  lastMessage: {type: Date, default: Date.now}
});

//logistics stuffs
userSchema.pre('save', function(next) {
  this.lastMessage = new Date();
  next();
});

userSchema.pre('remove', function(next) {
  Entity.remove({belongsTo: this._id}).exec();
  
  next();
});

//methods
userSchema.methods.forceLogout = function() {
  this.lastMessage = new Date("December 1, 1999"); //arbitrary old date
  this.save();
}

userSchema.methods.touch = function() {
  this.lastMessage = new Date();
  this.save();
}

//generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.createEntity = function(character, color, cb) {
  var entity = new Entity();
  var $this = this;
  entity.character = character;
  entity.color = color;
  entity.behavior = "player";
  entity.belongsTo = this._id;
  
  entity.save(function(err, entity) {
    if(err) return console.log(err);
    
    $this.entity = entity._id;
    $this.save(function(err, user) {
      if(err) return console.log(err);
      
      if(cb) {
        cb();
      }
    });
  });
}

//checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

//virtual for the user token
userSchema.virtual('token').get(function () {
  return {_id: this._id, name: this.name, email: this.email, description: this.description, donor: this.donor, admin: this.admin};
});

userSchema.virtual('loggedIn').get(function() {
  var now = new Date();
  var age = now.getTime() - this.lastMessage.getTime();
  var minutes = Math.round(age/(1000*60));
  return minutes < 10;
});

//create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
