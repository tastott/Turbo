///<reference path="./typings/angular.d.ts" />
///<reference path="./typings/angular-route.d.ts" />

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
wAngular.module('turboApp', ['ngRoute', 'angular-carousel'])
    .service('args', () => _args)
    .service('turboService', ['args', args => {
        var wheelSensorPin = args['wheel-sensor'];
        var crankSensorPin = args['crank-sensor'];

        return new Service.TurboService(() => GetSensor(wheelSensorPin, 5), () => GetSensor(crankSensorPin, 1.5));
    }])
    .controller('homeController', controllers.HomeController)
    .controller('rideController', controllers.RideController)
    //.directive('segmentDisplay', directives.SegmentDisplay)
    .config(['$routeProvider', ($routeProvider: ng.route.IRouteProvider) =>{
        $routeProvider
            .when('/ride',
            {
                controller: 'rideController',
                templateUrl: 'views/ride.html'
            })
            .when('/home',
            {
                controller: 'homeController',
                templateUrl: 'views/home.html'
            })
            .otherwise({redirectTo: '/home'});
    }]);
