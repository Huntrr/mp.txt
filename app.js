
/**
 * TODO
 * - Everything
 */

//setup cluster (for multi-cpu usage)
var cluster = require('cluster');

if(cluster.isMaster) {
  //first launch
  var cpuCount = require('os').cpus().length;
  
  for(var i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }
} else {
  //THIS is the "main" program that'll run on each fork of the cluster
  
  //module dependencies
  var express = require('express'),
      mongoose = require('mongoose'), //for mongodb
      bodyParser = require('body-parser'),
      favicon = require('serve-favicon'),
      errorHandler = require('errorhandler'),
      pjson = require('./package.json');
  
  //config grabbers
  var configDB = require('./config/database.js');
  var port = process.env.PORT || 80;
  
  //setup the app
  var app = express();
  
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

  
  app.listen(port);
  console.log("Magic starting on port %d in %s mode (worker #%d)", port, app.settings.env, (cluster ? cluster.worker.id : 1));
}
