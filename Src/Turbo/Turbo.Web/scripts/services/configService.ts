﻿import jr = require('../utilities/jsonReader')
import m = require('../models/models')
import ls = require('./logService')
import fs = require('fs')
import extend = require('extend')

export interface ConfigService {
    SetPowerCurve(curve: m.PowerCurve): void;
    Get(): m.Config
}

export class DummyConfigService implements ConfigService {

    private config: m.Config;

    constructor() {
        this.config = {
            PowerCurve: {
                Exponent: 2,
                Coefficient: 1,
                Fit: 0
            },
            TyreCircumference: 2.155
        };
    }

    SetPowerCurve(curve: m.PowerCurve) : void {
        this.config.PowerCurve = curve;
    }

    Get(): m.Config {
        var copy = extend(true, {}, this.config);
        return copy;
    }
}

export class FileConfigService implements ConfigService{

    private config: m.Config;
  
    constructor(private path: string,
        private logger: ls.LogService
     ) {
        if (fs.existsSync(path)) {
            try {
                this.config = jr.readJsonSync(path);
                this.logger.Info('Successfully loaded config from file.' , { path: path, config: this.config });
            }
            catch (error) {
                this.logger.Error('Error occurred while parsing config file. Using default config.', error, { path: path });
                this.LoadDefaultConfig();
            }
        }
        else {
            this.logger.Info('Config file not found. Using default config.', { path: path });
            this.LoadDefaultConfig();
        }
    }

    private LoadDefaultConfig(): void {
        this.config = {
            PowerCurve: {
                Exponent: 2,
                Coefficient: 1,
                Fit: 0
            },
            TyreCircumference: 2.155
        };
    }

    SetPowerCurve(curve: m.PowerCurve) {
        this.config.PowerCurve = curve;
    }

    Get(): m.Config {
        var copy = extend(true, {}, this.config);
        return copy;
    }

    private Save(): void {
        var json = JSON.stringify(this.config);
        fs.writeFile(this.path, json, error => {
            this.logger.Error('Error occurred while writing config to file.', error, { path: this.path }); 
        });
    }
} 