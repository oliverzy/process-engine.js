var Promise = require("bluebird");
Promise.longStackTraces();
var express = require('express'),
  namespace = require('express-namespace'),
  partialResponse = require('express-partial-response'),
  http = require('http'),
  path = require('path'),
  Datastore = require('nedb');

var app = module.exports = express();
/**
 * Configuration
 */
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.cookieSession({secret: 'some secret'}));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, '../public')));
app.use(app.router);
app.use(partialResponse());
app.use(express.errorHandler());

// Initial Data
require('./initData.js');

// Serve index
var index = function(req, res){
  res.render('../index');
};
app.get('/', index);

// Security
var userCollection = new Datastore();
userCollection.insert({name: 'admin', password: 'admin'});
app.set('Account', userCollection);
app.get('/api/auth/user', function(req, res) {
  //console.log(req.session);
  res.send(req.session.currentUser || "anonymousUser");
});

app.post('/login', function (req, res) {
  app.get('Account').findOne({name: req.body.username, password: req.body.password}, function (err, user) {
    if (user) {
      req.session.currentUser = req.body.username;
      res.send(200);
    } else
      res.send(404);
  });
});

app.post('/logout', function (req, res) {
  req.session = null;
  res.send(200);
});

// API
require('./api').addRoutes(app);

/**
 * Start Server
 */
http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});