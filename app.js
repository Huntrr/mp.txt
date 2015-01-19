
/**
 * TODO
 * - Everything
 */

//setup cluster (for multi-cpu usage)
var cluster = require('cluster'),
    net = require('net'); //needs for main master server, which delegates to workers


var port = process.env.PORT || 80;

if(cluster.isMaster) {
  //first launch
  var cpuCount = require('os').cpus().length;
  
  //stores our workers for future reference (to properly direct sockets)
  var workers = [];
  
  //helper function for spawning workers at index 'i'
  var spawn = function(i) {
    workers[i] = cluster.fork();
    
    //restart worker on exit
    workers[i].on('exit', function(worker, code, signal) {
      console.log('respawning worker', i);
      spawn(i);
    });
    
    //here is where master process closes the handle of connections
    //passed down to workers, workers must reply with a process message
    //{ act: 'sticky.accept', seq: ack } upon receival of a connection 
    //from master. (from cluster.js)
    workers[i].on('message', function(message) {
      if ( message.act == 'sticky.accept' ) {
        var _handle = handles[message.ack];
        
        //manually do what Node SHOULD do automatically
        if ( _handle ) {
          _handle.close();

          delete handles[message.ack];
        }
      }
    });
  }
  
  //spawn all the workers
  for(var i = 0; i < cpuCount; i += 1) {
    spawn(i);
  }
  
  //courtesy of https://github.com/elad/node-cluster-socket.io
  //==========================================================
  // Helper function for getting a worker index based on IP address.
  // This is a hot path so it should be really fast. The way it works
  // is by converting the IP address to a number by removing the dots,
  // then compressing it to the number of slots we have.
  //
  // Compared against "real" hashing (from the sticky-session code) and
  // "real" IP number conversion, this function is on par in terms of
  // worker index distribution only much faster.
  //==========================================================
  // Okay, Hunter here... IP length as a method of hashing?
  // Should work for now, but TODO: Rewrite this method for better sorts
  var worker_index = function(ip, len) {
    var s = '';
    for (var i = 0, _len = ip.length; i < _len; i++) {
      if (ip[i] !== '.') {
        s += ip[i];
      }
    }
    
    return Number(s) % len;
  };
  
  var handles = [], // (from cluster.js)
      seq = 0;
  
  //create the outside facing server listening on our port.
  var server = net.createServer(function(connection) {
    connection._handle.readStop();
    
    //we received a connection and need to pass it to the appropriate
    //worker. Get the worker for this connection's source IP and pass
    //it the connection.
    var worker = workers[worker_index(connection.remoteAddress, cpuCount)];
    
    handles[seq] = connection._handle;
    
    //sends worker a connection, (waiting for sticky.accept response)
    worker.send({ act: 'sticky.connect', seq: seq }, connection);
    seq++;
  }).listen(port);
} else {
  //THIS is the "main" program that'll run on each fork of the cluster
  
  //module dependencies
  var express = require('express'),
      mongoose = require('mongoose'), //for mongodb
      bodyParser = require('body-parser'),
      favicon = require('serve-favicon'),
      errorHandler = require('errorhandler'),
      socketio = require('socket.io'),
      sio_redis = require('socket.io-redis'),
      pjson = require('./package.json');
  
  //config grabbers
  var configDB = require('./config/database.js');
  
  //setup the app
  var app = new express();
  
  //main configuration
  mongoose.connect(configDB.url);
  
  //==========================
  //     CONFIGURE EXPRESS
  //==========================
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('port', port);
    app.set('view options', {
      pretty: true
    });
    //app.set('app url', pjson.domain); //for when everything is set up
    
    app.locals.version = pjson.version;
    app.locals.versionName = pjson.versionName;
    app.locals.appname = pjson.name;
    app.locals.pretty = true;
    app.locals.depends = pjson.dependencies;
    
    //app.use(express.logger('dev')); //deprecated
    
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    
    // Routing and rendering
    app.use(require('stylus').middleware({ src : __dirname + '/public' }));
    
    //============================
    //           ROUTES
    //============================
    require('./routes/game')(app);
    
    app.use(express.static(__dirname + '/public')); //for serving static resources
    
    app.use(favicon(__dirname + '/public/images/favicon.ico'));
    
    //404 errors
    app.use(function(req, res, next) {
      res.status(404);
      if (req.accepts("html")) {
        if(!req.user) {
          res.render("404.jade", { curUser: {user: null, loggedIn: false} });
        } else {
          res.render("404.jade", { curUser: {user: req.user, loggedIn: true} });
        }
        
        return;
      }

      if (req.accepts("json")) {
        res.send({
          error : "Not found"
        });
        return;
      }

      res.type('txt').send("Not found");
    });
  
  var env = process.env.NODE_ENV || 'development'
  if(env == 'development') {
    app.use(errorHandler({
      dumpExceptions : true,
      showStack : true
    }));
  } else if(env == 'production') {
    app.use(errorHandler());
  }

  
  var server = app.listen(0, 'localhost');
  console.log("Magic starting on port %d in %s mode (worker #%d)", 0, app.settings.env, (cluster ? cluster.worker.id : 1));
  
  //setup s.io
  var io = socketio(server);
  
  //tell Socket.IO to use the redis adapter.
  io.adapter(sio_redis({ host: 'localhost', port: 6379 }));
  
  //=========================
  //SOCKET.IO MIDDLEWARE HERE
  //=========================
  
  //listen to messages sent from the master. Ignore everything else.
  process.on('message', function(message, connection) {
    if (message.act !== 'sticky.connect') {
      return;
    }

    //emulate a connection event on the server by emitting the
    //event with the connection the master sent us.
    server.emit('connection', connection);
    console.log('Got connection (worker #%d)', (cluster ? cluster.worker.id : 1));
    
    process.send({ act: 'sticky.accept', seq: message.seq });
  });
}
