import m = require('../models/models')
var savedCurve: m.PowerCurve = require('../../data/power.json')

export class ConfigService {

    private curve: m.PowerCurve;

    constructor() {
        this.curve = savedCurve;
    }

    SavePowerCurve(curve: m.PowerCurve) {
        this.curve = curve;
    }

    GetPowerCurve(): m.PowerCurve {
        return this.curve;
    }
} 