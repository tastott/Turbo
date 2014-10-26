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
}