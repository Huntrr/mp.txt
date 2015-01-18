
/*
 * GET pages.
 */

module.exports = function(app, passport) {
  app.get('/', function(req, res) {
    res.render('play', { title: 'mp.txt' });
  })
}