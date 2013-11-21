
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , io = require('socket.io')
  , db = mongoose.connect('mongodb://localhost/christmas')
  , Schema = mongoose.Schema
  , ObjectID = Schema.ObjectId
  , Wish = require('./models/wish.js').init(Schema, mongoose);


var app = express();

app.configure(function(){
  app.engine('.html', require('ejs').__express);
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use('/assets', express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


var sio = io.listen(server);

//Configure the socket.io connection settings.
sio.configure(function (){
  sio.set('log level', 0);
  sio.set('authorization', function (handshakeData, callback) {
   callback(null, true); // error first callback style
  });
});

sio.sockets.on('connection', function (socket) {
  
  Wish.find({}, function(err, wishes){
   socket.emit('all', wishes);
  });

  socket.on('add', function(data){
     var wish = new Wish({
      name: data.title,
      message: data.message,
      email: data.email
    });

    console.log(wish);

    wish.save(function(err){
      if(err) throw err;
      socket.emit('added', wish);
      socket.broadcast.emit('added', wish);
    });
  });

  //disconnect state
  socket.on('disconnect', function(){
  });

});

//Our index page
app.get('/', routes.index);