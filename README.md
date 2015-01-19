# mp.txt
Node.js based engine for text-based "graphical" multiplayer games in the browser.

## How to use
**mp.txt** isn't quite plug and play. In order to get it working, you'll need a Redis server and a MongoDB. Redis is configured as just being on localhost:6379, MongoDB needs a bit of source modification to get working:

To set that up, drop a database.js file in a config folder in the app's root directory, and populate it as follows:
```
module.exports = {
  'url' : 'mongodb://<database-url>'
};
```

MongoDB is a MUST have for future world implementation (saving and all that). In theory, the Redis dependency COULD be removed, but it's in place right now to future proof our socket.io implementation; it makes clustering possible.