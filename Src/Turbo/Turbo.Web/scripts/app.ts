///<reference path="./typings/angularjs/angular.d.ts" />
///<reference path="./typings/angularjs/angular-route.d.ts" />

import Args = require('./args')
import Sensor = require('./services/sensor')
import Service = require('./services/turboService')
import cs = require('./services/configService')
import controllers = require('./controllers')
import ls = require('./services/logService')
import ss = require('./services/sensorService')

var nwgui = (<any>window).require('nw.gui');

var _args = Args.GetCLArgs();
var logger = new ls.WinstonLogService(_args['app-log']);

logger.Info('Launching app', { "launch-args": _args });

process.on('exit',() => logger.Info('Exiting app'));

//Fiddle a few things in dev mode
if (_args['dev-mode']) {
    var thisWindow = nwgui.Window.get();
    thisWindow.isFullscreen = false;
    thisWindow.width = 320;
    thisWindow.height = 280;
}

function GetSensor(pin, fakeFrequency :number) : Sensor.ISensorListener{
    if (pin) return new Sensor.OnOffSensorListener(pin)
    else return new Sensor.FakeSensorListener(fakeFrequency, 0.1);
}

var wAngular: ng.IAngularStatic = (<any>window).angular; //Dirty workaround because statically-loaded scripts aren't available as global variables in this context
wAngular.module('turboApp', ['ngRoute', 'angular-carousel', 'ui.bootstrap'])
    .value('args', _args)
    .value('logger', logger)
    .service('config', ['args', 'logger', (args: any, logger: ls.LogService) => {
        return args['config']
            ? new cs.FileConfigService(args['config'], logger)
            : new cs.DummyConfigService();
    }])
    .service('sensorService', ['args', 'config', 'logger',
        (args: any, config: cs.ConfigService, logger: ls.LogService) => {
            var wheelSensorPin = args['wheel-sensor'];
            var crankSensorPin = args['crank-sensor'];

            var sensors : any = {
                "Wheel": () => GetSensor(wheelSensorPin, 10),
                "Crank": () => GetSensor(crankSensorPin, 1.5)
            };

            return new ss.SensorService(sensors);
        }
    ])
    .service('turboService', ['args', 'config', 'logger', 'sensorService',
        (args: any, config: cs.ConfigService, logger : ls.LogService, sensorService: ss.SensorService) => {
            
            return new Service.TurboService(config,logger, sensorService, _args['data-logs']);
        }
    ])
    .controller(controllers.Names.Home, controllers.HomeController)
    .controller(controllers.Names.Ride, controllers.RideController)
    .controller(controllers.Names.Calibrate, controllers.CalibrationController)
    .controller(controllers.Names.CalibrationCapture, controllers.CalibrationCaptureController)
    //.directive('segmentDisplay', directives.SegmentDisplay)
    .config(['$routeProvider', ($routeProvider: ng.route.IRouteProvider) =>{
        $routeProvider
            .when('/ride',
            {
                controller: controllers.Names.Ride,
                templateUrl: 'views/ride.html'
            })
            .when('/home',
            {
                controller: controllers.Names.Home,
                templateUrl: 'views/home.html'
            })
            .when('/calibrate',
            {
                controller: controllers.Names.Calibrate,
                templateUrl: 'views/calibrate.html'
            })
            .otherwise({redirectTo: '/home'});
    }]);
