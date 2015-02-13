//imports
var User = require('./schema/user');
var Entity = require('./schema/entity');
var Room = require('./schema/room');

//constructor
function RoomInstance(socket, io) {
  this.socket = socket;
  this.io = io;
  this.roomId = "none";
  var $this = this;
  
  //figure out where the heck the user ought to be
  this.updateUser(function(user) {
    $this.user = user;
    
    if(user.entity) {
      if(user.entity.room) {
        //user has a room we can join
        $this.loadRoom(user.entity.room);
      } else {
        $this.loadDefaultRoom();
      }
    } else {
      user.createEntity('o', '#00FFFF', function() {
        $this.loadDefaultRoom();
      });
    }
  });
}

//methods
RoomInstance.prototype.sendToUser = function() {
  //sends the whole room to the user, for a complete load
  var $this = this;
  
  getUser($this.socket.decoded_token, function(err, user) {
    $this.room.getJSON(function(err, json) {
      if(err) return console.log(err.message);
      $this.socket.emit('world.load', {json: json, player_entity: user.entity});
    });
  });
  
}

RoomInstance.prototype.loadRoom = function(id) {
  //loads room and then sets user into that room
  var $this = this;
  Room.findById(id, function(err, room) {
    if(err) return console.log(err.message);
    
    $this.room = room;
    $this.socket.leave($this.roomId);
    $this.roomId = room.id;
    $this.socket.join($this.roomId);
    
    //saves user in new room
    Entity.update({_id: $this.user.entity}, {room: room.id}, function(err) {
      if(err) return console.log(err.message); 
      $this.sendToUser();
    });
    
    
  });
}

RoomInstance.prototype.loadDefaultRoom = function() {
  var $this = this;
  Room.findOne({ tag: 'default' }, function(err, room) {
    if(err) return console.log(err.message);
    $this.loadRoom(room._id);
  });
}

RoomInstance.prototype.broadcast = function(from, message) {
  var formatted = '[<span style="color: #BBBBBB">LOCAL</span>] ';
  var $this = this;
  Entity.getColor(from._id, function(color) {
    formatted = formatted + '(<span style="color: ' + color[0] + '">' + color[1] + '</span>) <span style="color: ' + color[0] + '">'+ from.name + '</span> ' + message;
    $this.io.to($this.roomId).emit('chat.post', {message: formatted});
  });
}
  
RoomInstance.prototype.updateUser = function(cb) {
  var $this = this;
  getUser(this.socket.decoded_token, function(err, user) {
    if(err) return console.log(err.message);
    
    $this.user = user;
    cb(user);
  });
}

module.exports = RoomInstance;

//STATIC FUNCTIONS
//function for getting the user out of a token
function getUser(token, cb) {
  User.findById(token._id)
      .populate('entity')
      .exec(function(err, user) {
        if(err) { return cb(err); }
        if(user) {
          user.touch();
          //console.log('Loaded user', user);
          cb(err, user);
        }
      });
}