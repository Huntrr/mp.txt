//DEF CONSOLE OBJECT
var Console = function(Socket) {
  
  var socket = Socket;
  
  var commandHistory = [];
  var historyIndex = 0;
  var $input = $('#field');
  var $form = $('#consoleform');

  //helper methods
  //POST(message) -- posts "message" to the console
  var post = function(message) {
    $('#messages').append('<li>' + message + '</li>');
    
    $('#messages').animate({
      scrollTop: $('#messages').get(0).scrollHeight}, 0);
  }
  
  //SEND(message) -- sends "message" to the server
  var send = function(message) {
    if(message.length > 0) {
      //is a command
      if(message.substring(0, 1) === '/') {
        message = message.substring(1);
        var arr = message.split(' ');
        var type = arr.shift();

        socket.emit('chat.command', {type: type, args: arr});

        //special case for logout command
        if(type === 'logout') {
          token = false;
          location.reload(true);
        }
      } else {
        //is regular speech
        socket.emit('chat.message', {message: message});
      }
    }
  }
  
  
  //SETUP LISTENERS
  socket.on('login.failure', function (data) {
    post('<span style="color: red">ERROR: ' + data.message + '</span>');
  });
  socket.on('login.success', function(data) {
    token = data.token;
    connect();
  });
  
  //posts a general chat message to the console
  socket.on('chat.post', function(data) {
    post(data.message);
  });
  socket.on('chat.error', function(data) {
    post("<span style='color: #FF0000'>" + data.message + "</span>");
  });
  socket.on('chat.success', function (data) {
    post("<span style='color: #00FF00'>" + data.message + "</span>");
  });
  
  //heartbeat
  socket.on('heartbeat', function(data) {
    var now = new Date();
    socket.emit('heartbeat', { type: 'ack', time: now });
  });
  socket.on("error", function(error) {
    if (error.type == "UnauthorizedError" || error.code == "invalid_token") {
      // redirect user to login page perhaps?
      post('<span style="color: #FF0000">ERROR: Can\'t validate session... Try refreshing?</span>');
    }
  });
  
  
  
  //LAYOUT CONTROL
  $form.submit(function (e) {
    e.preventDefault();
    commandHistory.push($input.val());
    historyIndex = 1;
    if(console) {
      console.send($input.val());
    }
    $input.val('');
  });
  $input.keydown(function (e) {
    if(e.which === 38) {
      //up key
      $input.val(commandHistory[commandHistory.length - historyIndex]);
      
      historyIndex++;
      if(historyIndex > commandHistory.length) { historyIndex = commandHistory.length; }
    } else if(e.which === 40) {
      //down key
      $input.val(commandHistory[commandHistory.length - historyIndex]);
      
      historyIndex--;
      if(historyIndex < 1) { historyIndex = 1; }
    }
  });
  
  
  
  //everything all set up right
  post("mp.txt client console");
  
  //public methods
  return {
    detach: function() {
      socket.removeAllListeners();
    },
    send: send,
    post: post
  };
}