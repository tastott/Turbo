///<reference path="./typings/node.d.ts" />
///<reference path="./typings/restify.d.ts" />

module Server {
    
    var restify = require('restify');

    export class TurboServer{
        
        private _service : Service.TurboService;
        
        constructor(){
            var sensor = new Sensor.FakeSensorListener();
            this._service = new Service.TurboService(sensor);
        }
        
        
        start(){
            
            var server = restify.createServer();
            server.use(restify.CORS());
            
            server.get('/test', (req, res, next)=>{
            	res.send({
            		hello: this._service.get()
            	});
            	next();
            });
            
            this._service.start();
            
            server.listen(8080, () =>{
            	console.log('%s listening at %s', server.name, server.url);
            });
        }
        
        stop(onStopped : () => void){
            this._service.stop(onStopped);
        }
    }
}
