///<reference path="../utilities.ts"/>
///<reference path="../typings/node.d.ts" />
import Q = require('q')

//export module Sensor {

    export interface ISensorListener {
        subscribe(onInput: (time: number) => void);
        start() : void;
        stop(): Q.Promise<void>;
    }

    interface SensorSubscription {
        (time: number) : void;
    }

    export class BaseSensorListener {
        private subs: SensorSubscription[];

        constructor() {
            this.subs = [];
        }

        subscribe(sub : SensorSubscription) {
            this.subs.push(sub);
        }

        onInput(time: number) {
            this.subs.forEach(sub => {
                sub(time);
            });
        }
    }
    
    export class FakeSensorListener extends BaseSensorListener implements ISensorListener {
        private timer: NodeJS.Timer;

        constructor(private frequency: number, private variance: number) {
            super();

        }

        start() {
            this.randomSense(time => this.onInput(time));
        }

        stop() {
            if (this.timer) clearTimeout(this.timer);
            return Q(<void>null);     
        }
        
        private randomSense(onInput : (time :number) => void){
            var delay = (1000 / this.frequency) + (Math.random() * (1000 / this.frequency) * this.variance);
            this.timer = setTimeout(() => {
                onInput(new Date().getTime());
                this.randomSense(onInput);
            }, delay);
        }
    }

    var childProcess = require('child_process');
    var onOffPath = require('path').resolve('scripts/services/onoff.js');

    export class OnOffSensorListener extends BaseSensorListener implements ISensorListener {
        private child: any;
        private started: boolean;

        constructor(private pin: number) {
            super();
            this.child = childProcess.spawn('node', [onOffPath, this.pin], {
                stdio: ['ipc']
            });
            this.child.on('message', data => {
                if (this.started) this.onInput(data);
            });
        }

        start() {
            this.started = true;
        }

        stop(): Q.Promise<void> {
            if (this.child) {
                this.child.kill();
            }

            return Q(<void>null);
        }
    }

    /*export class PythonSensorListener implements ISensorListener{
        
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
	}*/
//}