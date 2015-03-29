import fs = require('fs')
import m = require('../models/models')

export interface ConfigService {
    SetPowerCurve(curve: m.PowerCurve): void;
    GetPowerCurve(): m.PowerCurve;
}

export class DummyConfigService implements ConfigService {

    private curve: m.PowerCurve;

    constructor() {
        this.curve = {
            Coefficient: 1,
            Exponent: 2,
            Fit: 1
        };
    }

    SetPowerCurve(curve: m.PowerCurve) : void {
        this.curve = curve;
    }

    GetPowerCurve(): m.PowerCurve {
        return this.curve;
    }
}

export class FileConfigService {

    private config: m.Config;

    constructor(private path: string) {
        if (fs.existsSync(path)) {
            var configJson = fs.readFileSync(path, 'utf8');
            this.config = JSON.parse(configJson);
        }
        else throw 'Config file not found at ' + path;
    }

    SetPowerCurve(curve: m.PowerCurve) {
        this.config.PowerCurve = curve;
    }

    GetPowerCurve(): m.PowerCurve {
        return this.config.PowerCurve;
    }

    private Save(): void {
        var json = JSON.stringify(this.config);
        fs.writeFile(this.path, json, error => {
        });
    }
} 