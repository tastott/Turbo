///<reference path="./aggregation.ts" />
///<reference path="./sensor.ts" />

module Service {
    var _ = require('underscore');
    var moment = require('moment');
    var path = require('path');
    
    interface Aggregators{
        [index : string] : Aggregation.Aggregator;
    }
    
    export class TurboService{
        private _sensor : Sensor.ISensorListener;
        private _session : TurboSession;
        
        constructor(sensor : Sensor.ISensorListener){
            this._sensor = sensor;
            this._sensor.start(time => {
                if(this._session) this._session.update(time);
            });
        }
        
        startSession(){
           if(this._session) this._session.dispose();
           
           var id = moment().format('YYYYMMDDHHmmss');
           this._session = new TurboSession(id);
           
           return id;
        }
        
        stopSession(){
            if(this._session) {
                var id = this._session.id;
                this._session.dispose();
                this._session = null;
                return id;
            }
            else return null;
        }
        
        stop(onStopped: () => void){
            this._sensor.stop(onStopped);   
            
           
        }
        
        getSessionData(){
            if(this._session) {
                return _.object(_.map(this._session.aggregators, function (agg, key) {
                    return [key, agg.Value()];
                }));
            } else return null;
        }
    }
    
    class TurboSession {
        public aggregators : Aggregators;
         
        constructor(public id : string){
            var counter = new Aggregation.Counter();
            var odometer = new Aggregation.Odometer(2);
            var timer = new Aggregation.Timer();
            var speedo = new Aggregation.Speedometer(odometer, timer);
            
            this.aggregators = {};
            this.aggregators['Count'] = counter;
            this.aggregators['Timer'] = timer;
            this.aggregators['AverageSpeed'] = speedo;
            this.aggregators['CurrentAverageSpeed'] = new Aggregation.RollingSpeedometer(3000, 2);
            this.aggregators['Distance'] = odometer;
            this.aggregators['LogFile'] = new Aggregation.LogFile('logs/' + id + '.log', 100);
        }
        
        update(time : number){
            _.values(this.aggregators).forEach(agg => {
                agg.Put(time);
            });
        }
        
        dispose(){
            _.values(this.aggregators).filter(agg => agg.Dispose).forEach(agg => {
                agg.Dispose();
            });
        }
    }
}