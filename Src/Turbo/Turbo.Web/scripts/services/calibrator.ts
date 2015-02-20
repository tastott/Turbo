import Q = require('q')
import ts = require('turboService')
import m = require('../models/metric')

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