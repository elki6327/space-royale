var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
const { Client } = require('pg')

const bodyParser = require('body-parser');
var bodyParserz = bodyParser.urlencoded({ extended: false })

app.post('/registration', bodyParserz, function (req, res) {
  // Prepare output in JSON format
  var response = {
    nickname:req.body.nickname,
    email:req.body.register_email,
    password:req.body.register_password
  };

  console.log(response);
  res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', bodyParserz, function (req, res) {
  // Prepare output in JSON format
  var response = {
    email:req.body.email,
    password:req.body.password
  };

  console.log(response);
  res.sendFile(__dirname + '/public/index.html');
});


var players = {};
var star = {
  x: Math.floor(Math.random() * 3100) + 50,
  y: Math.floor(Math.random() * 1700) + 50
};
var scores = {
  blue: 0,
  red: 0
};

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'SpaceRoyale',
  password: 'admin',
  port: 5432,
})
client.connect()

app.use(express.static(__dirname + '/public'));
//
// app.get('/', function (req, res) {
//   res.sendFile(__dirname + '/public/game.html');
// });

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 6300) + 50,
    y: Math.floor(Math.random() * 3100) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the star object to the new player
  socket.emit('starLocation', star);
  // send the current scores
  socket.emit('scoreUpdate', scores);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);


  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('starCollected', function () {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 6300) + 50;
    star.y = Math.floor(Math.random() * 3100) + 50;
    io.emit('starLocation', star);
    io.emit('scoreUpdate', scores);

    var text = 'UPDATE "SpaceRoyale".Users SET starcount = starcount+1 WHERE userid = 1 RETURNING *'
    client.query(text, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(res.rows)
    }
})
    
  });

});

server.listen(3000, function () {
  console.log(`Listening on ${server.address().port}`);
  console.log(`Jump to http://localhost:${server.address().port}`);
});
