///<reference path="./typings/angularjs/angular.d.ts" />
///<reference path="./typings/angularjs/angular-route.d.ts" />

import Args = require('./args')
import Sensor = require('./services/sensor')
import Service = require('./services/turboService')
import controllers = require('./controllers')
var nwgui = (<any>window).require('nw.gui');

var _args = Args.GetCLArgs();

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
    .service('args', () => _args)
    .service('turboService', ['args', args => {
        var wheelSensorPin = args['wheel-sensor'];
        var crankSensorPin = args['crank-sensor'];

        return new Service.TurboService(() => GetSensor(wheelSensorPin, 10),
            () => GetSensor(crankSensorPin, 1.5),
            _args['logs']);
    }])
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
