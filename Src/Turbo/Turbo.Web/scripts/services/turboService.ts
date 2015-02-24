///<reference path="../typings/angular.d.ts"/>

import Utilities = require('../Utilities')
import Sensor = require('./sensor')
import _ = require('underscore')
var moment = require('moment');
var path = require('path');
import Q = require('q');
import Aggregation = require('./aggregation')
import d = require('../models/dictionary')
import m = require('../models/models')

var powerCurve : m.PowerCurve = require('../../data/power.json')

export interface SessionContext {
    Id: string;
}

export interface SensorConfig {
    GetSensor: () => Sensor.ISensorListener;
    GetAggregators(context : SessionContext): d.Dictionary<Aggregation.Aggregator>;
}

export interface TurboConfig {
    SensorConfigs: {
        [index: string]: SensorConfig
    }
}



class SensorSession {
    private sensor: Sensor.ISensorListener;
    private aggregators: d.Dictionary<Aggregation.Aggregator>;

    constructor(private config: SensorConfig, private context : SessionContext) {
        this.sensor = config.GetSensor();
        this.aggregators = config.GetAggregators(context);
        d.Values(this.aggregators).forEach(agg => {
            this.sensor.subscribe(time => agg.Put(time));
        });
    }

    start() {
        this.sensor.start();
    }

    stop(): Q.Promise<void> {
        d.Values(this.aggregators).forEach(agg => {
            if (agg.Dispose) agg.Dispose();
        });

        return this.sensor.stop();
    }

    getData(): d.Dictionary<any> {
        return d.Map(this.aggregators, a => a.Value());
    }
}


export class TurboService {
    private _session: TurboSession;
    private config: TurboConfig;

    constructor(makeWheelSensor: () => Sensor.ISensorListener,
        makeCrankSensor: () => Sensor.ISensorListener,
        private logPath: string) {

        var bike = {
            tireCircumference: 2.155
        };

        this.config = {
            SensorConfigs: {
                "Wheel": {
                    GetSensor: makeWheelSensor,
                    GetAggregators: (context) => {
                        var counter = new Aggregation.Counter();
                        var odometer = new Aggregation.Odometer(bike.tireCircumference);
                        var timer = new Aggregation.Timer();
                        var speedo = new Aggregation.Speedometer(odometer, timer);
                        var speedSeries = new Aggregation.RollingTimeSeries(speedo, 3000, 15);
                        var realLifeSpeedo = new Aggregation.SimpleRealLifeSpeedModel(wheelSpeed => wheelSpeed * 0.5, 1.22, 0.31, bike.tireCircumference, 3000);

                        var result: d.Dictionary<Aggregation.Aggregator> = {
                            'Count': counter,
                            'Timer': timer,
                            'AverageSpeed': speedo,
                            'CurrentAverageSpeed': new Aggregation.RollingSpeedometer(3000, bike.tireCircumference),
                            'Distance': odometer,
                            'SpeedSeries': speedSeries,
                            'RealLifeSpeed': realLifeSpeedo,
                            'CurrentPower': new Aggregation.RollingPowermeter(3000, powerCurve)
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
                        var result : d.Dictionary<Aggregation.Aggregator> = {
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
            this._session.Start();
            return id;
        };

        if (this._session)
            return this._session.Stop()
                .thenResolve(start());
        else return Q(start());
    }

    stopSession(): Q.Promise<string> {
        if (this._session) {
            var id = this._session.id;
            return this._session.Stop()
                .then(() => {
                this._session = null;
                return id;
            });
        }
        else return Q(<string>null);
    }

    getSessionData(): d.Dictionary<d.Dictionary<any>> {
        if (this._session) return this._session.GetData();
        else return null;
    }
}

export class TurboSession {
    private sensors: d.Dictionary<SensorSession>;

    constructor(public id: string, config: TurboConfig) {
        var context: SessionContext = {
            Id: id
        };

        this.sensors = d.Map(config.SensorConfigs,
            sc => new SensorSession(sc, context));
    }

    Start() {
        d.Values(this.sensors).forEach(s => s.start());
    }

    Stop(): Q.Promise<void> {
        return Q.all(d.Values(this.sensors).map(s => s.stop()))
            .thenResolve(<void>null);
    }

    GetData(): d.Dictionary<d.Dictionary<any>> {
        return d.Map(this.sensors, sensor => sensor.getData());
    }
}
//}