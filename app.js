var _sensor = require('./sensor').sensor;

var sensor = new _sensor.FakeSensorListener();
sensor.start(function(time){
    console.log(time);
});

process.stdin.on('data', function(key){
    sensor.stop();
    process.exit(); 
});