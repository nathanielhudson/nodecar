var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Gpio = require('chip-gpio').Gpio;

var m1d1 = new Gpio(0, 'low');
var m1d2 = new Gpio(1, 'low');
var m2d1 = new Gpio(2, 'low');
var m2d2 = new Gpio(3, 'low');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/virtualjoystick.js', function(req, res){
  res.sendFile(__dirname + '/virtualjoystick.js');
});

var drive = 0;
var turn = 0;

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('control', function(msg){
    drive = msg.drive;
    turn = msg.turn;
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

setInterval(function(){
  //TODO: FAKE PWM HERE.
  if (drive > 0.2) {
    m1d1.write(1);
    m1d2.write(0);
  } else if (drive < -0.2) {
    m1d1.write(0);
    m1d2.write(1);
  } else {
    m1d1.write(0);
    m1d2.write(0);
  }

  if (turn > 0.2) {
    m2d1.write(1);
    m2d2.write(0);
  } else if (turn < -0.2) {
    m2d1.write(0);
    m2d2.write(1);
  } else {
    m2d1.write(0);
    m2d2.write(0);
  }
}, 1/10 * 1000);

function exit() {
  btn.unexport();
  led.unexport();
  process.exit();
}

process.on('SIGINT', exit);
