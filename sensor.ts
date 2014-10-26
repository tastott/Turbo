module Sensor {
    export interface ISensorListener {
        start(onInput : (time : number) => void) : void;
        stop(onStopped : () => void);
    }
    
    export class FakeSensorListener implements ISensorListener {
        start(onInput : (time : number) => void) {
            this.randomSense(onInput);
        }
        
        stop(onStopped : () => void){
            if(onStopped) setTimeout(onStopped());
        }
        
        private randomSense(onInput : (time :number) => void){
            var delay = 200 + (Math.random() *50);
            setTimeout(() => {
                onInput(new Date().getTime());
                this.randomSense(onInput);
            }, delay);
        }
    }
    
   

    export class PythonSensorListener{
        
        private _gpioProcess : any;
        
	    constructor(pin : number){
	        
	    }
	    
    	start(onInput : (time : number) => void){
	        var childProcess = require('child_process');
		    this._gpioProcess = childProcess.spawn('python',['test.py']);
    		this._gpioProcess.stdout.on('data', function(data){
    			onInput(data);
    		});		
		    this._gpioProcess.stderr.on('data', function(data){
    			console.log('Error in python process: ' + data);
    		});
    	}
    	
		stop(onStopped : () => void){
    		this._gpioProcess.kill();
    		onStopped();
    	}
	}
}