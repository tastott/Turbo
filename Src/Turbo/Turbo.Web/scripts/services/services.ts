///<reference path="../typings/node.d.ts" />

import _ = require('underscore');
var moment = require('moment');
import path = require('path');
import aggregation = require('aggregation');
import sensor = require('sensor');
import utilities = require('utilities');

interface Aggregators {
    [index: string]: aggregation.Aggregator;
}

export class TurboService {
    private _session: TurboSession;

    constructor(private sensor: sensor.ISensorListener, private logPath: string) {
        this.sensor.start(time => {
            if (this._session) this._session.update(time);
        });
    }

    startSession() {
        if (this._session) this._session.dispose();

        var id = moment().format('YYYYMMDDHHmmss');
        this._session = new TurboSession(id, this.logPath);

        return id;
    }

    stopSession() {
        if (this._session) {
            var id = this._session.id;
            this._session.dispose();
            this._session = null;
            return id;
        }
        else return null;
    }

    stop(onStopped: () => void) {
        this.sensor.stop(onStopped);


    }

    getSessionData() : any {
        if (this._session) {
            return _.object(_.map(this._session.aggregators, function (agg, key) {
                return [key, agg.Value()];
            }));
        } else return null;
    }
}

class TurboSession {
    public aggregators: Aggregators;

    constructor(public id: string, private logPath: string) {
        var counter = new aggregation.Counter();
        var odometer = new aggregation.Odometer(2);
        var timer = new aggregation.Timer();
        var speedo = new aggregation.Speedometer(odometer, timer);

        this.aggregators = {};
        this.aggregators['Count'] = counter;
        this.aggregators['Timer'] = timer;
        this.aggregators['AverageSpeed'] = speedo;
        this.aggregators['CurrentAverageSpeed'] = new aggregation.RollingSpeedometer(3000, 2);
        this.aggregators['Distance'] = odometer;

        if (this.logPath != undefined && this.logPath != null)
            this.aggregators['LogFile'] = new aggregation.LogFile(utilities.resolve(this.logPath + '/' + id + '.log'), 100);
    }

    update(time: number) {
        _.values(this.aggregators).forEach(agg => {
            agg.Put(time);
        });
    }

    dispose() {
        _.values(this.aggregators).filter(agg => agg.Dispose).forEach(agg => {
            agg.Dispose();
        });
    }
}