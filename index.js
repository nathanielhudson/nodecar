var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Gpio = require('chip-gpio').Gpio;
var LiveCam = require('livecam');

var m1d1 = new Gpio(0, 'low');
var m1d2 = new Gpio(1, 'low');
var m2d1 = new Gpio(2, 'low');
var m2d2 = new Gpio(3, 'low');

const webcam_server = new LiveCam({
    'start' : function() {
        console.log('WebCam server started on :11000');
    }
});
webcam_server.broadcast();

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

var tick = 0; //approx ticksPerSec-ths of a second running. Duty cycle is per ticksPerSec-ths of a second.
var ticksPerSec = 50;
var cps = 1/300 * 1000;
var threshold = 0.0001;

setInterval(function(){
  tick+=cps/1000*ticksPerSec;
  if (tick > 1) {
    tick--;
  }

  if (drive > threshold) {
    dutyCycle(m1d1, drive, tick);
    m1d2.write(0);
  } else if (drive < -threshold) {
    m1d1.write(0);
    dutyCycle(m1d2, -drive, tick);
  } else {
    m1d1.write(0);
    m1d2.write(0);
  }

  if (turn > threshold) {
    dutyCycle(m2d1, turn, tick);
    m2d2.write(0);
  } else if (turn < -threshold) {
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
