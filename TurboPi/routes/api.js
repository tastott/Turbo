var _turbo = require('../bin/turbo');
var express = require('express');
var router = express.Router();

var sensor = process.argv[2] ? new _turbo.Sensor.PythonSensorListener(7)
    : new _turbo.Sensor.FakeSensorListener();
    
var service = new _turbo.Service.TurboService(sensor);

router.get('/start', function(req, res) {
  	res.send(service.startSession());
});

router.get('/stop', function(req, res) {
  	res.send(service.stopSession());
});

router.get('/data', function(req, res) {
  	res.send(service.getSessionData());
});

module.exports = router;
