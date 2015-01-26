var gameSocket;
var token;
var console = false;
var world = false;

//connection logic
function connect() {
  var url = "http://localhost:3000";
  if(gameSocket) {
    gameSocket.removeAllListeners();
  }
  if(console) {
    console.detach();
  }
  if(world) {
    world.detach();
  }
  
  if(token) {
    gameSocket = io(url + '/txt-world', {'forceNew': true, 'query': 'token=' + token});
  } else {
    gameSocket = io(url + '/txt-world', {'forceNew': true});
  }
  
  console = new Console(gameSocket);
  world = new World(gameSocket, console);
}

$(document).ready(function () { 
  //get temp token
  $.get("/temp", function(string) {
    token = string;
    connect();
  });
});