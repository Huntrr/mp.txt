
/*
 * GET pages.
 */
var User = require('./../app/schema/user');
var names = require('./../config/names');

module.exports = function(app, jwt, jwt_secret) {
  app.get('/', function(req, res) {
    res.render('play', { title: 'mp.txt' , IO_SERVER: 'http://localhost:3000' });
  });
  
  app.get('/temp', function(req, res) {
    //create a temporary user
    var temp = new User();
    temp.name = names[Math.floor(Math.random()*names.length)];
    temp.email = 'temp';
    temp.password = '';
    temp.description = 'Your ordinary nondescript person';
    temp.save(function(err, user) {
      if(err) {
        return console.log(err.message);
      }
      user.createEntity('o', '#0FFF0F');
      var token = jwt.sign(user.token, jwt_secret, { expiresInMinutes: 60*5 });
      
      res.send(token)
    });
    
  });
  
  app.get('/about', function(req, res) {
    res.render('about', {title: 'mp.txt'});
  });
}