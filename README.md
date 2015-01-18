# mp.txt
Node.js based engine for text-based "graphical" multiplayer games in the browser.

# How to use
**mp.txt** is more or less plug and play. If you've got node properly set up on your system, then you should be able to deploy by npm installing from the package.json and then running app.js.

This goes with one simple caveat. You'll need a Mongo database in order to get it all working. To set that up, drop a database.js file in a config folder in the app's root directory, and populate it as follows:
```
module.exports = {
  'url' : 'mongodb://<database-url>'
};
```
