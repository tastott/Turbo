///<reference path="./typings/angular.d.ts" />
///<reference path="./typings/angular-route.d.ts" />
///<reference path="./homeController.ts" />
///<reference path="./rideController.ts" />
///<reference path="./directives.ts" />
///<reference path="Services/turboService.ts"/>
///<reference path="Services/sensor.ts"/>
///<reference path="./args.ts" />
module turbo {

    var _args = Args.GetCLArgs();

    //Fiddle a few things in dev mode
    if (_args['dev-mode']) {
        var gui = require('nw.gui');
        var thisWindow = gui.Window.get();
        thisWindow.isFullscreen = false;
        thisWindow.width = 320;
        thisWindow.height = 280;
    }

    function GetSensor(pin): Sensor.ISensorListener{
        if (pin) return new Sensor.OnOffSensorListener(pin)
        else return new Sensor.FakeSensorListener();
    }

    angular.module('turboApp', ['ngRoute', 'angular-carousel'])
        .service('args', () => _args)
        .service('turboService', ['args', args => {
            var wheelSensorPin = args['wheel-sensor'];
            var crankSensorPin = args['crank-sensor'];

            return new Service.TurboService(() => GetSensor(wheelSensorPin), () => GetSensor(crankSensorPin));
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
}