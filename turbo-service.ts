///<reference path="./aggregation.ts" />
///<reference path="./sensor.ts" />

module Service {
    
    interface Aggregators{
        [index : string] : Aggregation.Aggregator;
    }
    
    export class TurboService{
        private _sensor : Sensor.ISensorListener;
        private _aggs : Aggregators;
        
        constructor(sensor : Sensor.ISensorListener){
            this._sensor = sensor;
            this._aggs = {};
            this._aggs['Count'] = new Aggregation.Counter();
        }
        
        start(){
            this._sensor.start(time => {
                Object.keys(this._aggs).forEach(aggName => {;
                    this._aggs[aggName].Put(time);
                });
            });
        }
        
        stop(onStopped: () => void){
            this._sensor.stop(onStopped);    
        }
        
        get(){
            return this._aggs['Count'].Value();
        }
    }
    
    
}