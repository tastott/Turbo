var _turbo = require('./turbo');

var server = new _turbo.Server.TurboServer();
server.start();

process.stdin.on('data', function(key){
    
    server.stop(function(){
        process.exit(); 
    });
});

console.log('Press any key to stop');