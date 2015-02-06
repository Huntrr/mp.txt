
/**
 * TODO
 * - Everything
 */

//setup cluster (for multi-cpu usage)
var cluster = require('cluster'),
    mongoose = require('mongoose'), //for mongodb
    net = require('net'); //needs for main master server, which delegates to workers

  var dburl; //database url

  //main MongoDB configuration
  if(process.env.DATABASE_URL) {
    var dburl = process.env.DATABASE_URL;
  } else {
    dburl = require('./config/database.js').url;
  }
  mongoose.connect(dburl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));

var port = process.env.PORT || 3000;

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
  
  
  //see if we need to spawn the default room/world
  var World = require('./app/schema/world');
  
  db.once('open', function (cb) {    
    console.log('Seeing if we need a default room');
    World.count({}, function(err, count) {
      if(err) { return console.log(err) };
      console.log('Current room count:', count);
      if(count === 0) {
        //spawn new world
        var world = new World({rooms: [],
                                name: "default",
                                description: "It's... Well it's a world." });
        world.save(function (err, newWorld) {
          if(err) { return console.log(err.message); }
          console.log('Created new world with id', newWorld.id);

          //add default room
          var newGenerator = require('./app/generators/basic/plains')(100, 50);
          newWorld.generateRoom(newGenerator, 0, 0, "default", 
            function(err, room) {
              if(err) { return console.log(err.message); }
              console.log("New room created with id" + room.id);
            });
        });
      }
    });
  });
  
} else {
  //THIS is the "main" program that'll run on each fork of the cluster
  
  //module dependencies
  var express = require('express'),
      bodyParser = require('body-parser'),
      favicon = require('serve-favicon'),
      errorHandler = require('errorhandler'),
      socketio = require('socket.io'),
      sio_redis = require('socket.io-redis'),
      pjson = require('./package.json');
  
  var jwt = require('jsonwebtoken');
  var socketio_jwt = require('socketio-jwt');
  var jwt_secret = process.env.SECRET_KEY || require('./config/jwt-secret').secret; //The super secret string that must not be shared with anyone
  
  //setup the app
  var app = new express();
  
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
    require('./routes/game')(app, jwt, jwt_secret);
    
    app.use(express.static(__dirname + '/public')); //for serving static resources
    
    app.use(favicon(__dirname + '/public/images/favicon.ico'));
    
    //404 errors
    app.use(function(req, res, next) {
      res.status(404);
      if (req.accepts("html")) {
        res.render("404.jade");
        
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
  if(process.env.REDISCLOUD_URL) {
    var redisServer = require('url').parse(process.env.REDISCLOUD_URL);
    var redis = require('redis');
    var pub = redis.createClient(redisServer.port, redisServer.hostname, {auth_pass: redisServer.auth.split(":")[1]});
    var sub = redis.createClient(redisServer.port, redisServer.hostname, {detect_buffers: true, auth_pass: redisServer.auth.split(":")[1]});
    io.adapter(sio_redis({pubClient: pub, subClient: sub}));
  } else {
    io.adapter(sio_redis({ host: 'localhost', port: 6379 }));
  }
  
  
  //=========================
  //SOCKET.IO MIDDLEWARE HERE
  //=========================
  
  //socket.io handlers
  db.once('open', function (cb) {    
    var world = require('./app/world')(io.of('/txt-world'),
                socketio_jwt.authorize({secret: jwt_secret, handshake: true}),
                db, jwt, jwt_secret);
  });
  
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
