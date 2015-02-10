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
        thisWindow.height = 240;
    }


    angular.module('turboApp', ['ngRoute'])
        .service('args', () => _args)
        .service('turboService', ['args', args => {
            var wheelSensorPin = args['wheel-sensor'];
            var wheelSensorListener: Sensor.ISensorListener;
            if (wheelSensorPin) wheelSensorListener = new Sensor.OnOffSensorListener(wheelSensorPin)
                //wheelSensorListener = new Sensor.PythonSensorListener(wheelSensorPin);
            else wheelSensorListener = new Sensor.FakeSensorListener();

            return new Service.TurboService(wheelSensorListener, args['logs']);
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