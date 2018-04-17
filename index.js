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

function dutyCycle(pin, duty, tick){ //sloppy duty cycle algorithm. There's probably an actual algorithm for this but yolo
  if (tick < duty) {
    pin.write(1);
  } else {
    pin.write(0);
  }
};

var tick = 0; //approx tenths of a second running. Duty cycle is per tenths of a second.
var cps = 1/300 * 1000;

setInterval(function(){
  tick+=cps/10;
  if (tick > 1) {
    tick--;
  }

  if (drive > 0.05) {
    dutyCycle(m1d1, drive, tick);
    m1d2.write(0);
  } else if (drive < -0.2) {
    m1d1.write(0);
    dutyCycle(m1d2, -drive, tick);
  } else {
    m1d1.write(0);
    m1d2.write(0);
  }

  if (turn > 0.2) {
    dutyCycle(m2d1, turn, tick);
    m2d2.write(0);
  } else if (turn < -0.2) {
    m2d1.write(0);
    dutyCycle(m2d2, -turn, tick);
  } else {
    m2d1.write(0);
    m2d2.write(0);
  }
}, cps);

function exit() {
  m1d1.unexport();
  m1d2.unexport();
  m2d1.unexport();
  m2d2.unexport();
  process.exit();
}

process.on('SIGINT', exit);
