var User = require('./schema/user');
var Validator = require('validator');

module.exports = function(cmd, socket, jwt, jwt_secret, io, room) {
  cmd.type = Validator.escape(cmd.type);
  if(cmd.type === 'login') {
    if(socket.decoded_token.email !== "temp") {
      socket.emit('chat.error', {message: 'You\'re already logged in!'});
      return;
    }
    
    if(cmd.args.length !== 2) { 
      socket.emit('chat.error', {message: Validator.escape('The proper format for that command is /login <email> <password>')});
      return;
    }
    var email = Validator.normalizeEmail(Validator.escape(cmd.args[0]));
    var password = Validator.escape(cmd.args[1]);
    
    if(email.length < 1 || password.length < 1) {
      socket.emit('chat.error', {message: Validator.escape('The proper format for that command is /login <email> <password>')});
      return;
    }
    
    User.findOne({'email': email}, function(err, user) {
      if(err) { 
        console.log(err.message); 
        socket.emit('login.failure', {message: 'Couldn\'t find user with that email'});
        return;
      }
      
      if(!user) {
        socket.emit('login.failure', {message: 'Couldn\'t find user with that email'});
        return;
      }
      
      if(user.validPassword(password)) {
        if(socket.decoded_token.email === 'temp') {
          //user is logged in as a temp account, let's destroy that account to prevent pollution
          User.remove({_id: socket.decoded_token._id}, function (err) {
            if(err) { console.log(err.message); }
          });
        }
        
        //login success!
        var token = jwt.sign(user.token, jwt_secret, { expiresInMinutes: 60*5 });
        socket.emit('login.success', {token: token});
        return;
      } else {
        socket.emit('login.failure', {message: 'Invalid password'});
      }
    });
    
    return;
  }
  
  if(cmd.type === 'logout') {
    //... well this just means the player has disconnected...
    //... nothing to see here.
    return;
  }
  
  if(cmd.type === 'register') {
    if(socket.decoded_token.email !== "temp") {
      socket.emit('chat.error', {message: 'You\'re already logged in!'});
      return;
    }
    
    if(cmd.args.length !== 3) {
      socket.emit('chat.error', {message: Validator.escape('The proper format for that command is /register <name> <email> <password>')});
      return;
    }
    
    var name = Validator.escape(cmd.args[0]);
    var email = Validator.escape(cmd.args[1]);
    var password = Validator.escape(cmd.args[2]);
    
    if(name.length < 1 || email.length < 1 || password.length < 1) {
      socket.emit('chat.error', {message: Validator.escape('The proper format for that command is /register <name> <email> <password>')});
      return;
    }
    
    //validate name
    if(!Validator.isAlphanumeric(name)) {
      socket.emit('chat.error', {message: 'ERROR: Names must only contain letters and numbers'});
      return;
    }
    if(!Validator.isLength(name, 2, 18)) {
      socket.emit('chat.error', {message: 'ERROR: Names must be between 2 and 18 characters'});
      return;
    }
    
    //validate password
    if(!Validator.isLength(password, 6, 20)) {
      socket.emit('chat.error', {message: 'ERROR: Passwords must be between 6 and 20 characters'});
      return;
    }
    
    //validate email
    if(!Validator.isEmail(email)) {
      socket.emit('chat.error', {message: 'ERROR: Not a valid email'});
      return;
    } else { email = Validator.normalizeEmail(email); }
    
    //all parts validated, time to make account
    User.count({email: email}, function(err, count) {
      if(err) {
        socket.emit('chat.error', {message: 'ERROR: Something went wrong...'});
        return console.log(err.message);
      }
      
      if(count > 0) {
        socket.emit('chat.error', {message: Validator.escape('ERROR: There is already a user with that email, try /login <email> <password>')});
        return;
      } else {
        //everything seems valid...
        var newUser = new User();
        newUser.name = name;
        newUser.email = email;
        newUser.password = newUser.generateHash(password);
        
        newUser.save(function(err, user) {
          if(err) {
            socket.emit('chat.error', {message: 'ERROR: Something went wrong...'});
            return console.log(err.message);
          }
          
          if(socket.decoded_token.email === 'temp') {
            //user is logged in as a temp account, let's destroy that account to prevent pollution
            //TODO: Transfer entity to new user before destroying temp
            User.remove({_id: socket.decoded_token._id}, function (err) {
              if(err) { console.log(err.message); }
            });
          }
          
          user.createEntity('o', '#00FFFF', function() {
            //user successfully created, now to log in
            var token = jwt.sign(user.token, jwt_secret, { expiresInMinutes: 60*5 });
            socket.emit('login.success', {token: token});
          });
          
          
        });
      }
    });
    return;
  }
  
  //---------------------------
  //       ADMIN COMMANDS
  //---------------------------
  if(socket.decoded_token.admin) {
    
    if(cmd.type === 'cleartemp') {
      User.remove({email: 'temp'}).exec();
      socket.emit('chat.success', {message: 'Cleared all temporary users'});
      
      return;
    }
    
    if(cmd.type === 'announce') { //admin only command
      //announces a message to the whole server
      if(cmd.args.length > 0) { 
        var msg = cmd.args.join(' ');
        console.log('Announcing', msg);
        io.emit('chat.post', {message: '[ANNOUNCEMENT] <span style="color: #FF0000">' + socket.decoded_token.name + "</span>: " + msg});
      } else {
        socket.emit('chat.error', {message: 'Add a message please...'});
      }

      return;
    }
  }
  
  socket.emit('chat.error', {message: 'That\'s not a command!'});
}