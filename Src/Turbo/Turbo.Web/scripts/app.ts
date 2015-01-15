///<reference path="./typings/angular.d.ts" />
///<reference path="./typings/angular-route.d.ts" />
///<reference path="./homeController.ts" />
///<reference path="./rideController.ts" />
///<reference path="./directives.ts" />
///<reference path="Services/turboService.ts"/>
///<reference path="Services/sensor.ts"/>
///<reference path="./args.ts" />
module turbo {

    angular.module('turboApp', ['ngRoute'])
        .service('args', () => Args.GetCLArgs())
        .service('turboService', ['args', args => {
            var wheelSensorPin = args['wheel-sensor'];
            var wheelSensorListener: Sensor.ISensorListener;
            if (wheelSensorPin) new Sensor.OnOffSensorListener(wheelSensorPin)
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