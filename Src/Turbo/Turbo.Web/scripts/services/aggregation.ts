///<reference path="../typings/node.d.ts" />
import fs = require('fs');
import path = require('path')

export interface Aggregator {
    Put(time: number): void;
    Value(): any;
    Dispose?: () => void;
}

export class Counter implements Aggregator {
    private _count: number;

    constructor() {
        this._count = 0;
    }

    Put(time: number) {
        this._count += 1;
    }

    Value() {
        return this._count;
    }
}

export class Odometer implements Aggregator {
    private _count: number;

    constructor(private unitDistance: number) {
        this._count = 0;
    }

    Put(time: number) {
        this._count += 1;
    }

    Value() {
        return this._count * this.unitDistance;
    }
}

export class Timer implements Aggregator {
    private _start: number;
    private _latest: number;

    constructor() {
        this._start = 0;
        this._latest = 0;
    }

    Put(time: number) {
        if (!this._start) this._start = time;
        this._latest = time;
    }

    Value() {
        return this._latest - this._start;
    }

}

export class Speedometer implements Aggregator {
    constructor(private odometer: Odometer, private timer: Timer) {

    }

    Put(time: number) {

    }

    Value() {
        var distanceKm = this.odometer.Value() / 1000;
        var hours = this.timer.Value() / 3600000;

        if (!hours) return 0;
        else return distanceKm / hours;
    }
}

export class RollingAggregator implements Aggregator {
    private _times: number[];

    constructor(private windowLength: number,
        private aggregate: (times: number[]) => any) {
        this._times = [];
    }

    Put(time: number) {
        var now = new Date().getTime();
        while (this._times.length && now - this._times[0] > this.windowLength) {
            this._times.shift();
        }
        this._times.push(time);
    }

    Value() {
        var now = new Date().getTime();
        while (this._times.length && now - this._times[0] > this.windowLength) {
            this._times.shift();
        }

        if (!this._times.length) return 0;
        else {
            return this.aggregate(this._times);
        }
    }
}

export class RollingSpeedometer extends RollingAggregator {

    constructor(windowLength: number, unitDistance: number) {
        super(windowLength,(times: number[]) => {
            var now = new Date().getTime();
            var distanceKm = times.length * unitDistance / 1000;
            var hours = (now - times[0]) / 3600000;

            if (!hours) return 0;
            else return distanceKm / hours;
        });
    }
}

export class RollingSpeedometerSi extends RollingAggregator {

    constructor(windowLength: number, unitDistance: number) {
        super(windowLength,(times: number[]) => {
            var now = new Date().getTime();
            var distanceM = times.length * unitDistance;
            var seconds = (now - times[0]) / 1000;

            if (!seconds) return 0;
            else return distanceM / seconds;
        });
    }
}

export class RollingCadenceometer extends RollingAggregator {
    constructor(windowLength: number) {
        super(windowLength,(times: number[]) => {
            var now = new Date().getTime();
            var minutes = (now - times[0]) / 60000;

            if (!minutes) return 0;
            else return times.length / minutes;
        });
    }
}

export class LogFile implements Aggregator {

    private _buffer: number[];

    constructor(private filePath: string, private bufferSize: number) {
        this._buffer = [];

        //Create directory if it doesn't exist
        var dir = path.dirname(filePath);
        if (dir && !fs.existsSync(dir))
            fs.mkdirSync(dir);
        
    }
        
    private Flush() {
        var data = this._buffer.map(d => '\r\n' + d).join('');
        fs.appendFile(this.filePath, data, err => {
            if(err) console.log('Error appending to log file at "' + this.filePath + '": ' + err);
        });
        this._buffer = [];
    }

    Put(time: number) {
        this._buffer.push(time);

        if (this._buffer.length > this.bufferSize) this.Flush();
    }

    Value() {
        return this.filePath;
    }

    Dispose() {
        if (this._buffer.length) this.Flush();
    }
}

export class RollingTimeSeries implements Aggregator {
    private lastTime: number;
    private data: any[][];

    constructor(private aggregator: Aggregator, private interval: number, private windowLength: number) {
        this.lastTime = 0;
        this.data = [];
    }

    Put(time: number) {
        if (time > this.lastTime + this.interval) {
            this.data.push([time, this.aggregator.Value()]);
            while (this.data.length > this.windowLength) this.data.shift();
        }
    }

    Value() {
        return this.data;
    }

    Dispose() {
    }
}

export class SimpleRealLifeSpeedModel implements Aggregator {

    private speedo: RollingSpeedometerSi;

    constructor(private resistance: (wheelSpeed : number) => number,
        private airDensity: number,
        private CdA: number,
        private unitDistance: number,
        private windowLength: number) {

        this.speedo = new RollingSpeedometerSi(windowLength, unitDistance);
    }

    Put(time: number) {
        this.speedo.Put(time);
    }

    Value() {
        var wheelSpeed = this.speedo.Value();
        var pedalForce = this.resistance(wheelSpeed);

        if (pedalForce == 0) return 0;

        //FWIND = 1/2 * air density * (coeff drag * frontal area) * V^2
        //V = (FWIND / (1/2 * air density * (coeff drag * frontal area)) ^ 0.5
        //Assume equilibrium and no other forces so FWIND is equal to force on pedals
        var realSpeed = (pedalForce / (0.5 * this.airDensity * this.CdA)) ^ 0.5;

        return realSpeed;
    }
}