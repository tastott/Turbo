///<reference path="../typings/angular.d.ts"/>
///<reference path="./aggregation.ts" />
///<reference path="./sensor.ts" />
///<reference path="../utilities.ts"/>
module Service {
    var _ = require('underscore');
    var moment = require('moment');
    var path = require('path');
    
    interface Aggregators{
        [index : string] : Aggregation.Aggregator;
    }

    export interface SessionContext {
        Id: string;
    }

    export interface SensorConfig {
        GetSensor: () => Sensor.ISensorListener;
        GetAggregators(context: SessionContext): Aggregation.Aggregator[]
    }

    export interface TurboConfig {
        SensorConfigs: {
            [index: string]: SensorConfig
        }
    }

    class SensorSession {
        private sensor: Sensor.ISensorListener;

        constructor(private config: SensorConfig) {

        }

        start() {
            this.confi
        }

        stop() {
        }
    }
    
    export class TurboService{
        private _session : TurboSession;
        
        constructor(private config: TurboConfig) {

            this.forEachSensor((sensorId, sensorConfig) => {
                sensorConfig.Sensor.start(time => {
                    if (this._session) {
                        this._session.update(sensorId, time);
                    }
                });
            });
        }

        private forEachSensor(action: (sensorId: string, sensorConfig: SensorConfig) => void) {
            Object.keys(this.config.SensorConfigs).forEach(sensorId => {
                action(sensorId, this.config.SensorConfigs[sensorId]);
            });
        } 
        
        startSession(){
           if(this._session) this._session.dispose();
           
           var id = moment().format('YYYYMMDDHHmmss');
           this._session = new TurboSession(id, this.config);
           
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
        
        stop(onStopped: () => void) {
            this.forEachSensor((sensorId, sensorConfig) => {
                sensorConfig.Sensor.stop(onStopped);
            });       
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
         
        constructor(public id: string, config: TurboConfig) {
            
        }

        blah(){
            var counter = new Aggregation.Counter();
            var odometer = new Aggregation.Odometer(2);
            var timer = new Aggregation.Timer();
            var speedo = new Aggregation.Speedometer(odometer, timer);
            var speedSeries = new Aggregation.RollingTimeSeries(speedo, 3000, 15);

            this.aggregators = {};
            this.aggregators['Count'] = counter;
            this.aggregators['Timer'] = timer;
            this.aggregators['AverageSpeed'] = speedo;
            this.aggregators['CurrentAverageSpeed'] = new Aggregation.RollingSpeedometer(3000, 2);
            this.aggregators['Distance'] = odometer;
            this.aggregators['SpeedSeries'] = speedSeries;

            if (this.logPath != undefined && this.logPath != null)
                this.aggregators['LogFile'] = new Aggregation.LogFile(Utilities.resolve(this.logPath + '/' + id + '.log'), 100);
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