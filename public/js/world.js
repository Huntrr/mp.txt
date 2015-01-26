//DEF WORLD OBJECT
var World = function(Socket, Console) {
  
  var socket = Socket;
  var console = Console;

  //helper methods
  
  
  //SETUP LISTENERS
  gameSocket.on('world.load', function (data) {
    $('#world').html(data.json);
    gameSocket.emit('world.load', { type: 'ack' });
  });
  
  //everything all set up right
  console.post("world loaded");
  
  //public methods
  return {
    detach: function() {
      socket.removeAllListeners();
    }
  };
}