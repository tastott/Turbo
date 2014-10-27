var _turbo = require('../bin/turbo');
var express = require('express');
var router = express.Router();

var sensor = process.argv[2] ? new _turbo.Sensor.PythonSensorListener(7)
    : new _turbo.Sensor.FakeSensorListener();
    
var service = new _turbo.Service.TurboService(sensor);
service.start();


router.get('/', function(req, res) {
  	res.send(service.get());
});

module.exports = router;
