var restify = require('restify');
var _turbo = require('./turbo');

var sensor = new _turbo.Sensor.FakeSensorListener();
var service = new _turbo.Service.TurboService(sensor);



var server = restify.createServer();
server.get('/test', function(req, res, next){
	res.send({
		hello: 'world'
	});
	next();
});

server.listen(8080, function(){
	console.log('%s listening at %s', server.name, server.url);
	console.log('Press any key to stop server');
});

process.stdin.on('data', function(key){
    
    service.stop(function(){
        process.exit(); 
    });
});