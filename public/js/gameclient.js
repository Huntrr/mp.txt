var gameSocket;
var token;

function connect() {
  var url = "http://localhost:3000";
  if(token) {
    gameSocket = io(url + '/txt-world', {'forceNew': true, 'query': 'token=' + token});
  } else {
    gameSocket = io(url + '/txt-world', {'forceNew': true});
  }
  
  loadGame();
}


$(document).ready(function () { 
  $.get("/temp", function(string) {
    token = string;
    connect();
  });
});

function loadGame() {
//helper methods
  var post = function(message) {
    $('#messages').append('<li>' + message + '</li>');
    
    $('#messages').animate({
      scrollTop: $('#messages').get(0).scrollHeight}, 0);
  }
  
  
  var send = function(message) {
    //is a command
    if(message.substring(0, 1) === '/') {
      message = message.substring(1);
      var arr = message.split(' ');
      var type = arr.shift();
      
      gameSocket.emit('command', {type: type, args: arr});
      
      //special case for logout command
      if(type === 'logout') {
        token = false;
        location.reload(true);
      }
    }
    
    //is regular speech
  }
  
  //loads the world
  gameSocket.on('world.load', function (data) {
    $('#world').html(data.json);
    socket.emit('world.load', { type: 'ack' });
  });
  
  gameSocket.on('login.failure', function (data) {
    post('<span style="color: red">ERROR: ' + data.message + '</span>');
  });
  
  gameSocket.on('login.success', function(data) {
    token = data.token;
    connect();
  });
  
  //posts a general chat message to the console
  gameSocket.on('chat.post', function(data) {
    post(data.message);
  });
  gameSocket.on('chat.error', function(data) {
    post("<span style='color: #FF0000'>" + data.message + "</span>");
  });
  gameSocket.on('chat.success', function (data) {
    post("<span style='color: #00FF00'>" + data.message + "</span>");
  });
  
  $('#consoleform').submit(function (e) {
    e.preventDefault();
    send($('#field').val());
    $('#field').val('');
  });
  
  gameSocket.on("error", function(error) {
    if (error.type == "UnauthorizedError" || error.code == "invalid_token") {
      // redirect user to login page perhaps?
      post('<span style="color: #FF0000">ERROR: Can\'t validate session... Try refreshing?</span>');
    }
  });
  
  post("mp.txt client console");
}


/*
 * Incoming messages to handle:
 *  - pong
 *  - world.load
 *  - time
 *
 * Outgoing messages to implement:
 *  - ping
 *  - command
 */