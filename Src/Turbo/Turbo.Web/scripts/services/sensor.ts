///<reference path="../utilities.ts"/>
///<reference path="../typings/node.d.ts" />
module Sensor {
    export interface ISensorListener {
        start(onInput : (time : number) => void) : void;
        stop(onStopped? : () => void);
    }
    
    export class FakeSensorListener implements ISensorListener {
        start(onInput : (time : number) => void) {
            this.randomSense(onInput);
        }
        
        stop(onStopped? : () => void){
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

    var childProcess = require('child_process');
    var onOffPath = require('path').resolve('scripts/services/onoff.js');

    export class OnOffSensorListener implements ISensorListener {
        private child: any;

        constructor(private pin: number) {
        }

        start(onInput: (time: number) => void) {
            this.child = childProcess.spawn('node', [onOffPath, this.pin], {
                stdio: ['ipc']
            });
            this.child.on('message', function (data) {
                onInput(data);
            }); 
        }

        stop(onStopped?: () => void) {
            if (this.child) {
                this.child.kill();
            }

            if (onStopped) setTimeout(onStopped());
        }
    }

    export class PythonSensorListener implements ISensorListener{
        
        private _gpioProcess : any;
        
	    constructor(pin : number){
	        
	    }
	    
    	start(onInput : (time : number) => void){
    	    var pythonPath = Utilities.resolve('test.py');
	        var childProcess = require('child_process');
		    this._gpioProcess = childProcess.spawn('python',[pythonPath]);
    		this._gpioProcess.stdout.on('data', function(data){
    			onInput(data);
    		});		
		    this._gpioProcess.stderr.on('data', function(data){
    			console.log('Error in python process: ' + data);
    		});
    		process.on('SIGTERM', () => {
              this.stop();
            });
    	}
    	
		stop(onStopped? : () => void){
    		this._gpioProcess.kill();
    		if(onStopped) onStopped();
    	}
	}
}