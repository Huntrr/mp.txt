var World = require('./schema/world');
var Room = require('./schema/room');
var Entity = require('./schema/entity');
var Object = require('./schema/object');
var Config = require('./schema/config');
var User = require('./schema/user');
var RoomInstance = require('./room');
var Validator = require('validator');

module.exports = function(io, toUse, db, jwt, jwt_secret) {
  io.use(toUse);
  
  console.log("Setting up instance of namespace /txt-world");
  io.on('connection', function (socket) {
    console.log('Connection received!');
    
    //emit message of the day
    Config.findOne({key: 'motd'}, function (err, motd) {
      console.log(motd.value);
      if(err) { console.log(err.message); } else {
        if(motd.value !== undefined) {
          socket.emit('chat.post', {message: '[MOTD] ' + motd.value});
        } else {
          var nmotd = new Config({ key: 'motd', value: 'Welcome to mp.txt!' });
          socket.emit('chat.post', {message: '[MOTD] ' + nmotd.value});
          nmotd.save(function (err) { if(err) { console.log(err.message); } });
        }
      }
    });
    
    //connect user to room (and just hope to god the default room exists before we find the user)
    socket.join(socket.decoded_token.email); //joins a room associated with that user's email address, for messaging purposes
    var roomInstance = new RoomInstance(socket, io);
    
    //rest of onConnection stuff
    console.log(socket.decoded_token.email, 'connected.');
    socket.on('ping', function (m) {
      socket.emit('pong', m);
    });
    socket.on('heartbeat', function(data) {
      getUser(socket.decoded_token, function(err, user) {
        //get user will automatically touch the user
      });
    });
    
    //handles commands
    socket.on('chat.command', function command(cmd) {
      console.log(socket.decoded_token.email, 'USED COMMAND', cmd.type, cmd.args);
      require('./command')(cmd, socket, jwt, jwt_secret, io, roomInstance);
    });
    
    socket.on('chat.message', function message(msg) {
      var cleanMessage = Validator.trim(Validator.stripLow(Validator.escape(msg.message)));
      console.log(socket.decoded_token.email, 'MESSAGED', cleanMessage);
      roomInstance.broadcast(socket.decoded_token, cleanMessage);
    });
    
    //"clean" disconnect (a little bit dirty right now)
    socket.on('disconnect', function (socket) {
      console.log('Someone is disconnecting');
      if(socket.decoded_token) {
        console.log(socket.decoded_token.email, 'disconnected');
        if(socket.decoded_token.email === 'temp') {
          //stop pollution, release the temp users
          User.remove({_id: socket.decoded_token._id}, function (err) {
            if(err) { console.log(err.message); }
          });
        }
      }
    });
    
    setInterval(function () {
      var now = new Date();
      socket.emit('heartbeat', {time: now});
    }, 15000);
  });
  
  
};


//function for getting the user out of a token
function getUser(token, cb) {
  User.findById(token._id)
      .populate('entity')
      .exec(function(err, user) {
        if(err) { return cb(err); }
        user.touch();
        cb(err, user);
      });
}