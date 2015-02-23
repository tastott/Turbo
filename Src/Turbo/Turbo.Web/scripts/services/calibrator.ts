import Q = require('q')
import ts = require('./turboService')
import m = require('../models/metric')
import sensor = require('./sensor')
import agg = require('./aggregation')
import _ = require('underscore')
import d = require('../models/dictionary')
var stats = require('simple-statistics')

export enum EventType {
    PreCaptureStarted,
    CaptureStarted,
    CaptureFinished
}

export interface CalibrationEvent {
    Type: EventType;
    Data?: any;
}


export interface PowerCurve {
    Coefficient: number;
    Exponent: number;
    Fit: number;
}

export interface PowerCurveResult {
    ErrorMessage?: string;
    Curve?: PowerCurve;
    Data?: { Speed: number; Power: number }[];
    IgnoredData?: { Speed: number; Power: number }[];  
}

export class PowerCurveCapture {
    private deferred: Q.Deferred<d.Dictionary<d.Dictionary<any>>>;
    private turboSession: ts.TurboSession;
    private checkSession: NodeJS.Timer;
    private checkInterval: number;
    private minInitialWheelRps: number;

    constructor(private makeWheelSensor: () => sensor.ISensorListener,
        private makeCrankSensor: () => sensor.ISensorListener) {
        this.checkInterval = 1000;
        this.minInitialWheelRps = 5;
    }

    Capture(): Q.Promise<PowerCurveResult> {
        return this.CaptureData()
            .then(data => {
                return GetPowerCurveFromWheelStop(data['Wheel']['Data'], data['Crank']['Data']);
            });
    }

    private CaptureData(): Q.Promise<d.Dictionary<d.Dictionary<any>>> {

        if (this.deferred && this.deferred.promise.inspect().state == 'pending') {
            this.deferred.reject('New capture started');
            this.deferred = null;
        }

        this.deferred = Q.defer<d.Dictionary<d.Dictionary<any>>>();

        this.Stop()
            .then(() => {
            this.turboSession = new ts.TurboSession(new Date().getTime().toString(), this.GetTurboConfig());
            this.checkSession = setInterval(() => {
              
                if (this.SessionIsComplete(this.turboSession)) {
                    if (this.deferred) {
                        this.Stop().
                            then(() => this.deferred.resolve(this.turboSession.GetData()));
                    }
                }
                else {
                    console.log('Session length: ' + this.turboSession.GetData()['Wheel']['Data'].length);
                }
            }, this.checkInterval);
            this.turboSession.Start();

        });

        return this.deferred.promise;
    }

    private SessionIsComplete(session: ts.TurboSession): boolean {

        var data = session.GetData();
        var crankPauses = GetCrankPauses(data['Crank']['Data']);

        return !!_.chain(crankPauses)
            .map(pause => GetTimesInRange(data['Wheel']['Data'], pause))
            .filter(wheelData => wheelData.length > 2
                && TimesToRps(wheelData)[0].Rps > this.minInitialWheelRps)
            .value()
            .length;

    }
    
    Stop(): Q.Promise<void> {


        if (this.checkSession) {
            clearInterval(this.checkSession);
            this.checkSession = null;
        }

        return this.turboSession ? this.turboSession.Stop() : Q(<void>null);
    }

    private GetTurboConfig(): ts.TurboConfig {
        return {
            SensorConfigs: {
                "Wheel": {
                    GetSensor: this.makeWheelSensor,
                    GetAggregators: context => {
                        return {
                            "Data": new agg.DataCollector(10000)
                        };
                    }
                },
                "Crank": {
                    GetSensor: this.makeCrankSensor,
                    GetAggregators: context => {
                        return {
                            "Data": new agg.DataCollector(10000)
                        };
                    }
                }
            }
        };
    }
}

function GetPowerCurveFromWheelStop(wheelData: number[], crankData: number[]): PowerCurveResult {
    var stops = GetCrankPauses(crankData)
        .map(pause => {
            return {
                Pause: pause,
                WheelData: GetTimesInRange(wheelData, pause)
            };
        });

    var powerVsSpeed =
        _.flatten(
            stops.map(stop => {
                var speedSegs = TimesToRps(stop.WheelData);
                var energySegs = ToEnergySegments(speedSegs);
                var powerSegs = ToPowerSegments(energySegs);
                return powerSegs.map(ps => {
                    var speed = (ps.To.Rps + ps.From.Rps) / 2;
                    return {
                        Speed: speed,
                        Power: ps.Power
                    };
                });
            })
        );

    if (!powerVsSpeed.length) return { ErrorMessage: "No pedalling pauses found" };

    //Filter out some values that are a bit crazy or will break the regression
    var filtered = _.partition(powerVsSpeed, pvs => Math.abs(pvs.Power) < 1000 && pvs.Power > 0 && pvs.Speed > 0);
    if (!filtered[0].length)
        return {
            ErrorMessage: "No useable data found",
            IgnoredData: filtered[1]
        };

    var curve = DoPowerRegression(filtered[0].map(pvs => [pvs.Speed, pvs.Power]));

    if (!curve)
        return {
            ErrorMessage: "Power regression for data failed",
            Data: filtered[0],
            IgnoredData: filtered[1]
        };

    return {
        Curve: curve,
        Data: filtered[0],
        IgnoredData: filtered[1]
    };
            
}

function DoPowerRegression(data: number[][]): PowerCurve {

    var logData = data.map(d => [Math.log(d[0]), Math.log(d[1])]);
    var logReg = stats
        .linear_regression()
        .data(logData);

    if (logReg.m() == undefined || logReg.b() == undefined) return null;
    else {
        var coefficient = Math.exp(logReg.b());
        var exponent = logReg.m();
        var fit = stats.r_squared(data, x => coefficient * Math.pow(x, exponent));

        return {
            Coefficient:coefficient,
            Exponent: exponent,
            Fit: fit
        };
    }
}

interface Range<T> {
    From: T;
    To: T
}


function ToPowerSegments(energySegments: EnergySegment[]): PowerSegment[]{

    return Fence(energySegments,(from, to) => {
        var time = (to.To - from.From) / 1000;
        var energyLoss = from.Joules - to.Joules;

        return {
            From: from,
            To: to,
            Power: time ? energyLoss / time : 0
        }
    });

}

function ToEnergySegments(wheelSpeedSegments: RpsSegment[]) : EnergySegment[] {
    var MoI = 0.18375;
    return wheelSpeedSegments.map(ss => {

        var angularV = ss.Rps * 2 * Math.PI;

        return {
            From: ss.From,
            To: ss.To,
            Rps: ss.Rps,
            Joules: 0.5 * MoI * Math.pow(angularV, 2)
        };
    });

}

function GetTimesInRange(times: number[], range : Range<number>) {
    return times.filter(t => t >= range.From && (range.To == null || t <= range.To));
}

function GetCrankPauses(crankData: number[]): Range<number>[]{

    if (crankData.length < 1) return [];

    var minPauseLength = 5;

    var now = new Date().getTime();

    var crankDataPlusNow = crankData.concat([new Date().getTime()])

    return TimesToRps(crankDataPlusNow)
        .filter(s => s.Rps < (1 / minPauseLength));

}

interface PowerSegment extends Range<EnergySegment> {
    Power: number;
}

interface RpsSegment extends Range<number>{
    Rps: number;
}

interface EnergySegment extends RpsSegment {
    Joules: number;
}

function TimesToRps(times: number[]): RpsSegment[] {
    var getRps = (from: number, to: number) => {
        if (from == to) return 0;
        else return 1000 / (to - from);
    }

    return Fence(times,(from, to) => {
        return {
            From: from,
            To: to,
            Rps: getRps(from, to)
        };
    });
}

function Fence<T, U>(items: T[], map: (from: T, to: T) => U): U[]{
    if (items.length < 2) return [];
    else {
        var out: U[] = [];

        for (var i = 0; i < items.length - 1; i++) {
            out.push(map(items[i], items[i + 1]));
        }

        return out;
    }
}

