///<reference path="./aggregation.ts" />
///<reference path="./sensor.ts" />

module Service {
    var _ = require('underscore');
    
    interface Aggregators{
        [index : string] : Aggregation.Aggregator;
    }
    
    export class TurboService{
        private _sensor : Sensor.ISensorListener;
        private _aggs : Aggregators;
        
        constructor(sensor : Sensor.ISensorListener){
            this._sensor = sensor;
            
            var counter = new Aggregation.Counter();
            var odometer = new Aggregation.Odometer(2);
            var timer = new Aggregation.Timer();
            var speedo = new Aggregation.Speedometer(odometer, timer);
            
            this._aggs = {};
            this._aggs['Count'] = counter;
            this._aggs['Timer'] = timer;
            this._aggs['AverageSpeed'] = speedo;
            this._aggs['Distance'] = odometer;
            this._aggs['LogFile'] = new Aggregation.LogFile('test.log', 100);
        }
        
        start(){
            this._sensor.start(time => {
                _.values(this._aggs).forEach(agg => {;
                    agg.Put(time);
                });
            });
        }
        
        stop(onStopped: () => void){
            this._sensor.stop(onStopped);   
            
           _.values(this._aggs).filter(agg => agg.Dispose).forEach(agg => {
                agg.Dispose();
            });
        }
        
        get(){
            
            return _.object(_.map(this._aggs, function (agg, key) {
                return [key, agg.Value()];
            }));
        }
    }
    
    
}