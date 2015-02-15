///<reference path="../typings/angular.d.ts"/>

import Utilities = require('../Utilities')
import Sensor = require('./sensor')
import _ = require('underscore')
var moment = require('moment');
var path = require('path');
import Q = require('q');
import Aggregation = require('./aggregation')

export interface Dictionary<T> {
    [index: string]: T;
}

export interface SessionContext {
    Id: string;
}

export interface SensorConfig {
    GetSensor: () => Sensor.ISensorListener;
    GetAggregators(context : SessionContext): Dictionary<Aggregation.Aggregator>;
}

export interface TurboConfig {
    SensorConfigs: {
        [index: string]: SensorConfig
    }
}

function Values<T>(dict: Dictionary<T>): T[] {
    return _.values(dict);
}

function Map<T, U>(dict: Dictionary<T>, func: (value: T) => U): Dictionary<U> {
    return <any>_.object(_.keys(dict).map(key => {
        return [key, func(dict[key])];
    }));
}

class SensorSession {
    private sensor: Sensor.ISensorListener;
    private aggregators: Dictionary<Aggregation.Aggregator>;

    constructor(private config: SensorConfig, private context : SessionContext) {
        this.sensor = config.GetSensor();
        this.aggregators = config.GetAggregators(context);
        Values(this.aggregators).forEach(agg => {
            this.sensor.subscribe(time => agg.Put(time));
        });
    }

    start() {
        this.sensor.start();
    }

    stop(): Q.Promise<void> {
        Values(this.aggregators).forEach(agg => {
            if (agg.Dispose) agg.Dispose();
        });

        return this.sensor.stop();
    }

    getData(): Dictionary<any> {
        return Map(this.aggregators, a => a.Value());
    }
}

export class TurboService {
    private _session: TurboSession;
    private config: TurboConfig;

    constructor(makeWheelSensor: () => Sensor.ISensorListener,
        makeCrankSensor: () => Sensor.ISensorListener,
        private logPath : string) {
        this.config = {
            SensorConfigs: {
                "Wheel": {
                    GetSensor: makeWheelSensor,
                    GetAggregators: (context) => {
                        var counter = new Aggregation.Counter();
                        var odometer = new Aggregation.Odometer(2);
                        var timer = new Aggregation.Timer();
                        var speedo = new Aggregation.Speedometer(odometer, timer);
                        var speedSeries = new Aggregation.RollingTimeSeries(speedo, 3000, 15);

                        var result : Dictionary<Aggregation.Aggregator> = {
                            'Count': counter,
                            'Timer': timer,
                            'AverageSpeed': speedo,
                            'CurrentAverageSpeed': new Aggregation.RollingSpeedometer(3000, 2),
                            'Distance': odometer,
                            'SpeedSeries': speedSeries
                        };

                        if (this.logPath != undefined && this.logPath != null) {
                            result['LogFile'] = this.MakeLogger(context, 'wheel');
                        }

                        return result;
                    }
                },
                "Crank": {
                    GetSensor: makeCrankSensor,
                    GetAggregators: (context) => {
                        var result : Dictionary<Aggregation.Aggregator> = {
                            "Cadence": new Aggregation.RollingCadenceometer(5000)
                        };

                        if (this.logPath != undefined && this.logPath != null) {
                            result['LogFile'] = this.MakeLogger(context, 'crank');
                        }

                        return result;
                    }
                }
            }
        };

       
    }

    private MakeLogger(context: SessionContext, name: string) {
        var filePath = Utilities.resolve(this.logPath + '/' + context.Id + '/' + name + '.log');
        return new Aggregation.LogFile(filePath, 100);
    }

    startSession(): Q.Promise<string> {

        var start = () => {
            var id = moment().format('YYYYMMDDHHmmss');
            this._session = new TurboSession(id, this.config);
            this._session.start();
            return id;
        };

        if (this._session)
            return this._session.stop()
                .thenResolve(start());
        else return Q(start());
    }

    stopSession(): Q.Promise<string> {
        if (this._session) {
            var id = this._session.id;
            return this._session.stop()
                .then(() => {
                this._session = null;
                return id;
            });
        }
        else return Q(<string>null);
    }

    getSessionData(): Dictionary<Dictionary<any>> {
        if (this._session) {
            return Map(this._session.sensors, sensor => sensor.getData());
        } else return null;
    }
}

class TurboSession {
    public sensors: Dictionary<SensorSession>;

    constructor(public id: string, config: TurboConfig) {
        var context: SessionContext = {
            Id: id
        };

        this.sensors = Map(config.SensorConfigs,
            sc => new SensorSession(sc, context));
    }

    start() {
        Values(this.sensors).forEach(s => s.start());
    }

    stop(): Q.Promise<void> {
        return Q.all(Values(this.sensors).map(s => s.stop()))
            .thenResolve(<void>null);
    }
}
//}