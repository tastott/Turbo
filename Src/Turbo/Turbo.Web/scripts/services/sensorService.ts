import sensor = require('./sensor')
import d = require('../models/dictionary')

export enum SensorType {
    Wheel,
    Crank
}

export class SensorService {

    constructor(private sensors: d.Dictionary<() => sensor.ISensorListener>) {
    }

    MakeSensor(sensorType: SensorType): sensor.ISensorListener {
        var sensorTypeName = SensorType[sensorType];
        return this.sensors[sensorTypeName]();
    }
}