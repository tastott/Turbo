import Q = require('q')
import ts = require('turboService')
import m = require('../models/metric')
import _ = require('underscore')
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

export class Calibrator {
    constructor(private onEvent: (event: CalibrationEvent) => void) {
    }

    start() {
    }

    stop() {
    }

    getMetrics(): m.Metric[]{
        return [];
    }
} 

class CaptureSession {
    start(): Q.Promise<string> {


        return Q('test');

    }
}

export function GetPowerCurveFromWheelStop(wheelData: number[], crankData: number[]): { Speed: number; Power: number }[] {
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

    
    var pvsLogs = powerVsSpeed
        .filter(pvs => Math.abs(pvs.Power) < 1000)
        .map(pvs => [Math.log(pvs.Speed), Math.log(pvs.Power)]);

    var logReg = stats
        .linear_regression()
        .data(pvsLogs);

    

    return powerVsSpeed;
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
    return times.filter(t => t >= range.From && t <= range.To);
}

function GetCrankPauses(crankData: number[]): Range<number>[]{

    var pauses: Range<number>[] = [];
    var minPauseLength = 3;

    var speedSegments = TimesToRps(crankData);

    return speedSegments.filter(s => s.Rps < (1 / minPauseLength));
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

