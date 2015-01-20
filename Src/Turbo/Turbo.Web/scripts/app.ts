///<reference path="./typings/angular.d.ts" />
///<reference path="./typings/angular-route.d.ts" />
///<reference path="./directives.ts" />

import Args = require('./args');
import sensor = require('./services/sensor');
import services = require('./services/services');
import controllers = require('./controllers');
import nwgui = require('nw.gui');

angular.module('turboApp', ['ngRoute'])
    .service('args', () => { return {}; })
    .service('turboService', ['args', args => {
        var wheelSensorPin = args['wheel-sensor'];
        var wheelSensorListener: sensor.ISensorListener;
        if (wheelSensorPin) wheelSensorListener = new sensor.OnOffSensorListener(wheelSensorPin)
            //wheelSensorListener = new Sensor.PythonSensorListener(wheelSensorPin);
        else wheelSensorListener = new sensor.FakeSensorListener();

        return new services.TurboService(wheelSensorListener, args['logs']);
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

//if (Args.GetCLArgs()['show-dev-tools']) {
//    nwgui.Window.get().showDevTools();
//}