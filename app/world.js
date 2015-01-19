var World = require('./schema/world');
var Room = require('./schema/room');
var Entity = require('./schema/entity');
var Object = require('./schema/object');
var Config = require('./schema/config');
var User = require('./schema/user');


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
    
    //see if we need to spawn the default room/world
    World.count({}, function(err, count) {
      if(err) { return console.log(err) };
      
      if(count === 0) {
        //spawn new world
        var world = new World({rooms: [],
                                name: "default",
                                description: "It's... Well it's a world." });
        world.save(function (err, newWorld) {
          if(err) { return console.log(err.message); }
          
          //add default room
          newWorld.newRoom(require('./../config/defaultRoom'), function(err, room) {
            if(err) { return console.log(err.message); }
            
            console.log("New room created with id " + room.id);
          })
        });
      }
    });
    
    //rest of onConnection stuff
    console.log(socket.decoded_token.email, 'connected.');
    socket.on('ping', function (m) {
      socket.emit('pong', m);
    });
    
    socket.on('command', function command(cmd) {
      console.log(socket.decoded_token.email, 'used command', cmd.type, cmd.args)
      require('./command')(cmd, socket, jwt, jwt_secret, io);
    });
    
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
      socket.emit('time', Date());
    }, 5000);
  });
  
  
};